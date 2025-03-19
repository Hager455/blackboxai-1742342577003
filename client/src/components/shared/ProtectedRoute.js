import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, Spinner, Center } from '@chakra-ui/react';

const ProtectedRoute = ({ children, role }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <Center h="100vh">
                <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                />
            </Center>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (role && user?.role !== role) {
        // Redirect to appropriate dashboard based on user's role
        const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/voter/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    // If authenticated and role check passes, render the protected content
    return <Box>{children}</Box>;
};

export default ProtectedRoute;
