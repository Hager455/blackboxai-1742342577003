import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Box, Button, VStack, Text, useToast } from '@chakra-ui/react';

const FaceDetector = ({ onDetectionComplete }) => {
    const webcamRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const toast = useToast();

    const capture = useCallback(async () => {
        setIsCapturing(true);
        try {
            const imageSrc = webcamRef.current.getScreenshot();
            
            // Call API to verify if face is real
            const response = await fetch('/api/verify/face-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageSrc }),
            });
            
            const result = await response.json();
            
            if (result.success) {
                toast({
                    title: 'Face Verified',
                    description: 'Real face detected',
                    status: 'success',
                });
                onDetectionComplete(imageSrc);
            } else {
                toast({
                    title: 'Verification Failed',
                    description: 'Please try again',
                    status: 'error',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to process image',
                status: 'error',
            });
        }
        setIsCapturing(false);
    }, [webcamRef, onDetectionComplete, toast]);

    return (
        <VStack spacing={4} align="center">
            <Box borderWidth={2} borderRadius="lg" overflow="hidden">
                <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    mirrored={true}
                    style={{ width: '100%', maxWidth: '400px' }}
                />
            </Box>
            <Button
                colorScheme="blue"
                isLoading={isCapturing}
                onClick={capture}
                leftIcon={<i className="fas fa-camera" />}
            >
                Capture Face
            </Button>
            <Text fontSize="sm" color="gray.600">
                Please ensure your face is clearly visible and well-lit
            </Text>
        </VStack>
    );
};

export default FaceDetector;
