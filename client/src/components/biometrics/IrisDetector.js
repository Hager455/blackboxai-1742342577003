import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Box, Button, VStack, Text, useToast, Circle } from '@chakra-ui/react';

const IrisDetector = ({ onDetectionComplete }) => {
    const webcamRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [guidePosition, setGuidePosition] = useState({ x: 0, y: 0 });
    const toast = useToast();

    // Update guide circle position based on webcam dimensions
    const handleUserMedia = () => {
        const video = webcamRef.current.video;
        setGuidePosition({
            x: video.videoWidth / 2,
            y: video.videoHeight / 2,
        });
    };

    const capture = useCallback(async () => {
        setIsCapturing(true);
        try {
            const imageSrc = webcamRef.current.getScreenshot();
            
            // Call API to detect iris
            const response = await fetch('/api/verify/iris-detection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageSrc }),
            });
            
            const result = await response.json();
            
            if (result.success && result.iris_detected) {
                toast({
                    title: 'Iris Detected',
                    description: 'Successfully captured iris image',
                    status: 'success',
                });
                onDetectionComplete(imageSrc);
            } else {
                toast({
                    title: 'Detection Failed',
                    description: 'Please ensure your iris is clearly visible',
                    status: 'warning',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to process iris detection',
                status: 'error',
            });
        }
        setIsCapturing(false);
    }, [webcamRef, onDetectionComplete, toast]);

    return (
        <VStack spacing={4} align="center">
            <Box 
                borderWidth={2} 
                borderRadius="lg" 
                overflow="hidden" 
                position="relative"
            >
                <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    onUserMedia={handleUserMedia}
                    style={{ width: '100%', maxWidth: '400px' }}
                    videoConstraints={{
                        width: 1280,
                        height: 720,
                        facingMode: "user"
                    }}
                />
                {/* Guidance overlay */}
                <Circle
                    size="100px"
                    border="2px dashed"
                    borderColor="blue.500"
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    pointerEvents="none"
                />
                <Text
                    position="absolute"
                    bottom="10px"
                    left="50%"
                    transform="translateX(-50%)"
                    color="white"
                    fontSize="sm"
                    bg="blackAlpha.600"
                    px={3}
                    py={1}
                    borderRadius="md"
                >
                    Align your eye within the circle
                </Text>
            </Box>
            <Button
                colorScheme="blue"
                isLoading={isCapturing}
                onClick={capture}
                leftIcon={<i className="fas fa-camera" />}
            >
                Capture Iris
            </Button>
            <Text fontSize="sm" color="gray.600">
                Position your eye close to the camera and keep it steady
            </Text>
            <Text fontSize="xs" color="gray.500">
                Ensure good lighting and remove glasses if wearing any
            </Text>
        </VStack>
    );
};

export default IrisDetector;
