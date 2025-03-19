import React from 'react';
import {
    Box,
    Spinner,
    Text,
    VStack,
    useColorModeValue,
} from '@chakra-ui/react';

const LoadingSpinner = ({ 
    message = 'Loading...', 
    size = 'xl', 
    thickness = '4px',
    height = '100vh',
    color = 'blue.500'
}) => {
    const textColor = useColorModeValue('gray.600', 'gray.400');

    return (
        <Box
            height={height}
            width="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <VStack spacing={4}>
                <Spinner
                    thickness={thickness}
                    speed="0.65s"
                    emptyColor="gray.200"
                    color={color}
                    size={size}
                />
                <Text color={textColor} fontSize="lg">
                    {message}
                </Text>
            </VStack>
        </Box>
    );
};

export default LoadingSpinner;
