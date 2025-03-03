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
    const [awake, setAwake] = useState(false);
    const [backEndStatus, setBackEndStatus] = useState(null);

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
            setServerResponse({ category: "Backend server refused connection 😓 Please click reset and try again 🙏"});
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
        setAwake(false);
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

    const wakeupBackend = async () => {
        try {
            const wakeupResp = await fetch('https://object-detector-resnet101.onrender.com/');
            const data = await wakeupResp.json();
            console.log('Backend server status:', data);
            setAwake(true);
            setBackEndStatus(data['status']);
        } catch (error) {
            console.error('Error contacting the server:', error);
            setBackEndStatus('We\'re sorry, the backend server is not responding 😓 Please try again.');
        }
    }

    return (
        <div className="mx-80 flex flex-col rounded-xl px-52 py-10 lg:px-96">
            {isVisible && (
                <div className="text-2xl font-semibold text-center">
                    <div className="justify-items-center">
                        {!awake ? (
                            <>  <div className='font-semibold text-2xl mx-20 mb-16'>
                                    <h1>
                                        The backend server is sleeping 😴 Click below 👇 to wake it up
                                    </h1>
                                </div>
                                <div className="px-4 py-3 mb-14 rounded-xl bg-gray-300 text-gray-950 font-semibold hover:bg-gray-800 hover:text-gray-300">
                                    <button
                                        onClick={wakeupBackend}
                                    >
                                        Wake up
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className='mx-auto mb-14 mt-10 justify-items-center'>
                                <motion.h3
                                    className="mt-10 text-2xl font-semibold logo"
                                    initial={{ opacity: 0, y: -20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1 }}
                                    viewport={{ once: true}}
                                >
                                    {backEndStatus}
                                </motion.h3>
                                <div className="upload-container mt-14 mb-14 px-40 justify-items-center">
                                    <input type="file" accept="image/*" />
                                </div>
                                <div className="px-8 py-3 mb-20 rounded-xl bg-gray-300 text-gray-700 hover:bg-gray-900 hover:text-gray-300">
                                    {!isPlaying && (
                                        <button 
                                            onClick={uploadImage}
                                        >
                                            Detect
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        
                    </div>
                    {isSearching ? (
                        
                        <div className="mx-auto px-6 py-6 mb-14 justify-items-center rounded-3xl shadow-2xl max-w-screen-lg bg-gradient-to-b from-gray-700 to-gray-900">
                            {isPlaying && (
                                <img 
                                    src={images[currentImageIndex]} 
                                    alt={`Image ${currentImageIndex + 1}`} 
                                />
                            )}
                            
                        </div>
                    ) : (
                        serverResponse && (
                            <div className='justify-items-center'>
                                {imageSrc && (
                                    <div className="mx-auto px-6 py-6 mb-14 justify-items-center rounded-3xl shadow-2xl max-w-screen-lg bg-gradient-to-b from-gray-700 to-gray-900">
                                        <img 
                                            src={imageSrc} 
                                            alt="Selected" 
                                        />
                                    </div>
                                )}
                                <div className="mx-auto mb-14 justify-items-center">
                                    <h3>Your Uploaded Image contains:</h3>
                                    <motion.h4
                                        className="mt-10 text-4xl font-bold logo2"
                                        initial={{ opacity: 0, y: -20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 1.5 }}
                                        viewport={{ once: true}}
                                    >
                                        {serverResponse["category"]}
                                    </motion.h4>
                                </div>
                                <div className="mb-5 px-8 py-3 justify-items-center rounded-xl bg-gray-300 text-gray-950  hover:bg-gray-950 hover:text-gray-300">
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
