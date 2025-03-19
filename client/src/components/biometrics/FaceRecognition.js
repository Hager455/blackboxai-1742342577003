import React, { useState } from 'react';
import { Box, VStack, Text, Progress, useToast } from '@chakra-ui/react';

const FaceRecognition = ({ faceImage, onRecognitionComplete }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const toast = useToast();

    React.useEffect(() => {
        const processImage = async () => {
            if (!faceImage) return;
            
            setIsProcessing(true);
            try {
                // Call API for face recognition
                const response = await fetch('/api/verify/face-recognition', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ image: faceImage }),
                });
                
                const result = await response.json();
                
                if (result.success) {
                    toast({
                        title: 'Recognition Complete',
                        description: 'Face successfully recognized',
                        status: 'success',
                    });
                    onRecognitionComplete(result.verificationId);
                } else {
                    toast({
                        title: 'Recognition Failed',
                        description: 'Unable to recognize face',
                        status: 'error',
                    });
                }
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to process recognition',
                    status: 'error',
                });
            }
            setIsProcessing(false);
        };

        processImage();
    }, [faceImage, onRecognitionComplete, toast]);

    return (
        <VStack spacing={4} align="center">
            <Box 
                borderWidth={2} 
                borderRadius="lg" 
                overflow="hidden"
                position="relative"
            >
                <img 
                    src={faceImage} 
                    alt="Captured face" 
                    style={{ width: '100%', maxWidth: '400px' }} 
                />
                {isProcessing && (
                    <Box 
                        position="absolute" 
                        top="0" 
                        left="0" 
                        right="0" 
                        bottom="0" 
                        bg="blackAlpha.50" 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center"
                    >
                        <Progress 
                            size="xs" 
                            isIndeterminate 
                            width="80%" 
                            colorScheme="blue" 
                        />
                    </Box>
                )}
            </Box>
            <Text fontSize="sm" color={isProcessing ? "blue.500" : "gray.600"}>
                {isProcessing ? 'Processing face recognition...' : 'Face recognition complete'}
            </Text>
        </VStack>
    );
};

export default FaceRecognition;
