import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@chakra-ui/react';

export const useWebcam = (options = {}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState(null);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const toast = useToast();

    const defaultOptions = {
        width: 640,
        height: 480,
        facingMode: 'user',
        audio: false,
    };

    const webcamOptions = { ...defaultOptions, ...options };

    // Initialize webcam
    const initializeWebcam = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: webcamOptions.width,
                    height: webcamOptions.height,
                    facingMode: webcamOptions.facingMode,
                },
                audio: webcamOptions.audio,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);
                setIsActive(true);
            }

            return true;
        } catch (error) {
            console.error('Webcam initialization error:', error);
            setError(error);
            toast({
                title: 'Camera Error',
                description: 'Failed to access webcam. Please ensure camera permissions are granted.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [webcamOptions, toast]);

    // Stop webcam
    const stopWebcam = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsActive(false);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [stream]);

    // Capture frame
    const captureFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data as base64
        return canvas.toDataURL('image/jpeg', 0.9);
    }, []);

    // Take photo
    const takePhoto = useCallback(async () => {
        if (!isActive) {
            throw new Error('Webcam is not active');
        }

        try {
            const imageData = captureFrame();
            if (!imageData) {
                throw new Error('Failed to capture image');
            }
            return imageData;
        } catch (error) {
            console.error('Photo capture error:', error);
            toast({
                title: 'Capture Failed',
                description: 'Failed to capture photo. Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            throw error;
        }
    }, [isActive, captureFrame, toast]);

    // Switch camera
    const switchCamera = useCallback(async () => {
        const currentFacingMode = webcamOptions.facingMode;
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

        // Stop current stream
        stopWebcam();

        // Update options and reinitialize
        webcamOptions.facingMode = newFacingMode;
        return initializeWebcam();
    }, [webcamOptions, stopWebcam, initializeWebcam]);

    // Check if device has multiple cameras
    const checkMultipleCameras = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            return videoDevices.length > 1;
        } catch (error) {
            console.error('Error checking cameras:', error);
            return false;
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        initializeWebcam();

        // Cleanup on unmount
        return () => {
            stopWebcam();
        };
    }, [initializeWebcam, stopWebcam]);

    // Handle visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopWebcam();
            } else {
                initializeWebcam();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [initializeWebcam, stopWebcam]);

    return {
        isLoading,
        isActive,
        error,
        videoRef,
        canvasRef,
        stream,
        initializeWebcam,
        stopWebcam,
        takePhoto,
        captureFrame,
        switchCamera,
        checkMultipleCameras,
    };
};

export default useWebcam;
