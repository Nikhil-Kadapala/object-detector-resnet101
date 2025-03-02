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
            const imageModules = import.meta.glob('./images/*.{png,jpg,jpeg,svg,webp}');
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
            const response = await fetch('http://localhost:5000/', 
            {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            console.log('Server response:', data);
            console.log(data.stopSlideshow);
            console.log('Server response:', data);
            if (data.stopSlideshow) {
                console.log('Server indicated to not start the slideshow');
                setIsPlaying(true);
                await sleep(5000);
            }
            setServerResponse(data); // Note: Accessing the first element of the array
        } catch (error) {
            console.error('Error starting slideshow:', error);
            setServerResponse({ error: error.message });
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
        return <div>Loading images...</div>;
    }

    return (
        <div className="mx-2 flex flex-col rounded-xl bg-gradient-to-b from-blue-500 via-blue-700 to-blue-900 px-4 py-10 lg:px-20">
            {isVisible && (
                <div className="status-message">
                    <>
                        <h2>Upload an Image and click on Identify</h2>
                        <div className="upload-container">
                            <input type="file" accept="image/*" />
                        </div>
                        <div className="controls">
                            {!isPlaying && (
                                <button onClick={uploadImage}>Identify</button>
                            )}
                        </div>
                    </>
                    {isSearching ? (
                        
                        <div className="image-container">
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
                                    <div className="image-preview">
                                        <img 
                                            src={imageSrc} 
                                            alt="Selected" 
                                        />
                                    </div>
                                )}
                                <div className="relative flex mx-auto max-w-screen-3xl bg-gradient-to-b from-blue-500 via-blue-700 to-blue-900">
                                    <h3>Your Uploaded Image contains:</h3>
                                    <motion.h4
                                        className="mt-10 text-6xl font-semibold "
                                        initial={{ opacity: 0, y: -20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8 }}
                                        viewport={{ once: true}}
                                    >
                                        {serverResponse["category"]}
                                    </motion.h4>
                                </div>
                                <div className="controls">
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
