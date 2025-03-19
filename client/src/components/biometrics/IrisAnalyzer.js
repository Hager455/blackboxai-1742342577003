import React, { useState, useEffect } from 'react';
import { 
    Box, 
    VStack, 
    Text, 
    Progress, 
    useToast,
    HStack,
    Circle
} from '@chakra-ui/react';

const IrisAnalyzer = ({ irisImage, onAnalysisComplete }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [matchPercentage, setMatchPercentage] = useState(null);
    const toast = useToast();

    useEffect(() => {
        const analyzeIris = async () => {
            if (!irisImage) return;
            
            setIsProcessing(true);
            try {
                // Simulate analysis progress
                const progressInterval = setInterval(() => {
                    setAnalysisProgress(prev => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return 90;
                        }
                        return prev + 10;
                    });
                }, 200);

                // Call API for iris analysis
                const response = await fetch('/api/verify/iris-analysis', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ image: irisImage }),
                });
                
                const result = await response.json();
                clearInterval(progressInterval);
                setAnalysisProgress(100);
                
                if (result.success) {
                    setMatchPercentage(result.confidence * 100);
                    toast({
                        title: 'Analysis Complete',
                        description: 'Iris pattern successfully analyzed',
                        status: 'success',
                    });
                    onAnalysisComplete(result.verification_id);
                } else {
                    toast({
                        title: 'Analysis Failed',
                        description: result.error || 'Unable to analyze iris pattern',
                        status: 'error',
                    });
                }
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to process iris analysis',
                    status: 'error',
                });
            }
            setIsProcessing(false);
        };

        analyzeIris();
    }, [irisImage, onAnalysisComplete, toast]);

    return (
        <VStack spacing={4} align="center" w="100%">
            <Box 
                borderWidth={2} 
                borderRadius="lg" 
                overflow="hidden"
                position="relative"
                w="100%"
                maxW="400px"
            >
                <img 
                    src={irisImage} 
                    alt="Captured iris" 
                    style={{ width: '100%' }} 
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
                        flexDirection="column" 
                        alignItems="center" 
                        justifyContent="center"
                        p={4}
                    >
                        <Progress 
                            value={analysisProgress}
                            size="xs" 
                            width="80%" 
                            colorScheme="blue" 
                            mb={2}
                        />
                        <Text fontSize="sm" color="blue.600">
                            Analyzing iris pattern: {analysisProgress}%
                        </Text>
                    </Box>
                )}
            </Box>

            {/* Analysis Results */}
            {matchPercentage !== null && (
                <Box 
                    w="100%" 
                    maxW="400px" 
                    p={4} 
                    borderWidth={1} 
                    borderRadius="lg"
                    bg="gray.50"
                >
                    <VStack spacing={3}>
                        <Text fontWeight="semibold">Analysis Results</Text>
                        <HStack spacing={4}>
                            <Circle 
                                size="40px" 
                                bg={matchPercentage >= 85 ? "green.500" : "red.500"}
                                color="white"
                            >
                                <i className={`fas fa-${matchPercentage >= 85 ? 'check' : 'times'}`} />
                            </Circle>
                            <Box>
                                <Text fontSize="sm" color="gray.600">Match Confidence</Text>
                                <Text fontSize="lg" fontWeight="bold">
                                    {matchPercentage.toFixed(1)}%
                                </Text>
                            </Box>
                        </HStack>
                        <Text fontSize="sm" color={matchPercentage >= 85 ? "green.600" : "red.600"}>
                            {matchPercentage >= 85 
                                ? 'Iris pattern verified successfully' 
                                : 'Iris pattern verification failed'}
                        </Text>
                    </VStack>
                </Box>
            )}

            <Text fontSize="sm" color="gray.600">
                {isProcessing 
                    ? 'Processing iris analysis...' 
                    : matchPercentage !== null 
                        ? 'Analysis complete' 
                        : 'Waiting to start analysis'}
            </Text>
        </VStack>
    );
};

export default IrisAnalyzer;
