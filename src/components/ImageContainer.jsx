import React, { useState, useEffect, useCallback } from 'react';
import { motion } from "framer-motion";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const ImageContainer = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [images, setImages] = useState([]);
    const [isVisible, setIsVisible] = useState(true);
    const [serverResponse, setServerResponse] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);

    useEffect(() => {
        const loadImages = async () => {
            const imageModules = import.meta.glob('../images/*.{png,jpg,jpeg,svg,webp,js}', { eager: false });
            const imageUrls = [];
            
            for (const path in imageModules) {
                const module = await imageModules[path]();
                imageUrls.push(module.default);
            }
            setImages(imageUrls);
        };
        loadImages();
    }, []);
    

    useEffect(() => {
        let interval;
        if (isPlaying && images.length > 0) {
            interval = setInterval(() => {
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, images]);

    const stopSlideshow = useCallback(() => {
        setIsPlaying(false);
        setCurrentImageIndex(0);
        setIsVisible(false);
    }, []);

    const startSlideshow = useCallback(async (file) => {
        setIsSearching(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const response = await fetch('https://object-detector-resnet101.onrender.com/', 
            {
                method: 'POST',
                body: formData,
                mode: 'cors',
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Server response:', data);
            if (data.stopSlideshow) {
                console.log('Server indicated to not start the slideshow');
                setIsPlaying(true);
                await sleep(5000);
            }
            setServerResponse(data);
        } catch (error) {
            console.error('Error contacting the server:', error);
            setServerResponse({ category: "Backend server is inactive 😓 Please try again later 🙏"});
        } finally {
            setIsSearching(false);
        }
    }, []);

    const uploadImage = () => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageSrc(reader.result);
                startSlideshow(file);
            };
            reader.readAsDataURL(file);
        }
        else {
            alert('No image uploaded');
        }
    };

    const resetView = () => {
        setIsVisible(true);
        setServerResponse(null);
        setImageSrc(null);
        // Clear the file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    };

   
    useEffect(() => {
        if (serverResponse && serverResponse.stopSlideshow) {
            sleep(1000).then(() => {
                stopSlideshow();
                setIsVisible(true);
            });
        }
    }, [serverResponse, stopSlideshow]);

    if (images.length === 0) {
        return <div>Loading the Database...</div>;
    }

    return (
        <div className="mx-80 flex flex-col rounded-xl px-52 py-10 lg:px-96">
            {isVisible && (
                <div className="text-2xl font-semibold text-center">
                    <div className="">
                        <h1>Upload an Image and click on Detect</h1>
                        <div className="upload-container mt-10 mb-10 px-40 items-center">
                            <input type="file" accept="image/*" />
                        </div>
                        <div className="mx-60 mb-14 rounded-xl bg-gray-300 text-gray-700 hover:bg-gray-900 hover:text-gray-300">
                            {!isPlaying && (
                                <button 
                                    onClick={uploadImage}
                                >
                                    Detect
                                </button>
                            )}
                        </div>
                    </div>
                    {isSearching ? (
                        
                        <div className="mx-auto mb-10">
                            {isPlaying && (
                                <img 
                                    src={images[currentImageIndex]} 
                                    alt={`Image ${currentImageIndex + 1}`} 
                                />
                            )}
                            
                        </div>
                    ) : (
                        serverResponse && (
                            <div>
                                {imageSrc && (
                                    <div className="mx-auto mb-14">
                                        <img 
                                            src={imageSrc} 
                                            alt="Selected" 
                                        />
                                    </div>
                                )}
                                <div className="mx-auto mb-14 justify-center">
                                    <h3>Your Uploaded Image contains:</h3>
                                    <motion.h4
                                        className="mt-10 text-2xl font-semibold logo"
                                        initial={{ opacity: 0, y: -20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 1 }}
                                        viewport={{ once: true}}
                                    >
                                        {serverResponse["category"]}
                                    </motion.h4>
                                </div>
                                <div className="mx-60 mb-5 rounded-xl bg-gray-300 text-gray-950  hover:bg-gray-950 hover:text-gray-300">
                                    <button 
                                        onClick={resetView}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>   
            )}
        </div>
    );
};

export default ImageContainer;
