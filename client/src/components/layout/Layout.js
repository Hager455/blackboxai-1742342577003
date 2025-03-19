import React from 'react';
import { Box, Flex, useColorModeValue, Container } from '@chakra-ui/react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
    const { isAuthenticated, role } = useAuth();
    const bgColor = useColorModeValue('gray.50', 'gray.900');

    return (
        <Box minH="100vh" bg={bgColor}>
            <Navbar />
            <Flex>
                {isAuthenticated && (
                    <Box
                        w="64"
                        display={{ base: 'none', md: 'block' }}
                    >
                        <Sidebar role={role} />
                    </Box>
                )}
                <Box
                    flex="1"
                    p={{ base: 4, md: 8 }}
                    ml={{ base: 0, md: isAuthenticated ? 64 : 0 }}
                >
                    <Container maxW="container.xl">
                        {children}
                    </Container>
                </Box>
            </Flex>
        </Box>
    );
};

export default Layout;
