import React from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    VStack,
    useColorModeValue,
    Icon,
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
    const { isAuthenticated, user } = useAuth();
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const textColor = useColorModeValue('gray.600', 'gray.400');

    const getHomeRoute = () => {
        if (!isAuthenticated) return '/login';
        return user?.role === 'admin' ? '/admin/dashboard' : '/voter/dashboard';
    };

    return (
        <Box bg={bgColor} minH="100vh" py={20}>
            <Container maxW="lg" textAlign="center">
                <VStack spacing={8}>
                    <Icon
                        as={FaExclamationTriangle}
                        w={20}
                        h={20}
                        color="yellow.400"
                    />
                    
                    <Heading size="2xl">404</Heading>
                    
                    <Heading size="xl">Page Not Found</Heading>
                    
                    <Text fontSize="lg" color={textColor}>
                        The page you're looking for doesn't exist or has been moved.
                    </Text>

                    <Button
                        as={RouterLink}
                        to={getHomeRoute()}
                        size="lg"
                        colorScheme="blue"
                        leftIcon={<FaHome />}
                    >
                        Return Home
                    </Button>
                </VStack>
            </Container>
        </Box>
    );
};

export default NotFound;
