import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    // Check if user is authenticated on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                setIsAuthenticated(true);
            } else {
                // Clear invalid token
                localStorage.removeItem('token');
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                setUser(data.user);
                setIsAuthenticated(true);

                toast({
                    title: 'Login Successful',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                // Redirect based on role
                if (data.user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/voter/dashboard');
                }

                return true;
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            toast({
                title: 'Login Failed',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return false;
        }
    };

    const logout = async () => {
        try {
            // Call logout endpoint if needed
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage and state
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
            navigate('/');

            toast({
                title: 'Logged Out',
                status: 'info',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (data.success) {
                setUser(prevUser => ({
                    ...prevUser,
                    ...data.user
                }));

                toast({
                    title: 'Profile Updated',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                return true;
            } else {
                throw new Error(data.error || 'Failed to update profile');
            }
        } catch (error) {
            toast({
                title: 'Update Failed',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return false;
        }
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        updateProfile,
        role: user?.role || 'voter'
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                Loading...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
