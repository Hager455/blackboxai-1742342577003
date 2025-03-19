import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { authService, stateService } from '../services';
import { storage } from '../utils/appUtils';
import { config } from '../config/appConfig';

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = storage.get('token');
                if (token) {
                    const response = await authService.verifyToken();
                    if (response.success) {
                        setIsAuthenticated(true);
                        setUser(response.user);
                        stateService.updateAuthState({
                            isAuthenticated: true,
                            user: response.user,
                            role: response.user.role,
                        });
                    } else {
                        handleLogout();
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                handleLogout();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // Login
    const login = useCallback(async (credentials) => {
        try {
            setIsLoading(true);
            const response = await authService.login(credentials);

            if (response.success) {
                setIsAuthenticated(true);
                setUser(response.user);

                stateService.updateAuthState({
                    isAuthenticated: true,
                    user: response.user,
                    role: response.user.role,
                });

                // Navigate to appropriate dashboard
                const redirectPath = response.user.role === 'admin' 
                    ? config.ROUTES.ADMIN.DASHBOARD 
                    : config.ROUTES.VOTER.DASHBOARD;
                
                navigate(redirectPath, { replace: true });

                toast({
                    title: 'Login Successful',
                    description: `Welcome back, ${response.user.firstName}!`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                return true;
            }

            throw new Error(response.error || 'Login failed');
        } catch (error) {
            console.error('Login error:', error);
            toast({
                title: 'Login Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [navigate, toast]);

    // Register
    const register = useCallback(async (userData) => {
        try {
            setIsLoading(true);
            const response = await authService.register(userData);

            if (response.success) {
                toast({
                    title: 'Registration Successful',
                    description: 'Please login to continue',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });

                navigate(config.ROUTES.PUBLIC.LOGIN, { replace: true });
                return true;
            }

            throw new Error(response.error || 'Registration failed');
        } catch (error) {
            console.error('Registration error:', error);
            toast({
                title: 'Registration Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [navigate, toast]);

    // Logout
    const handleLogout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear auth state regardless of logout API success
            setIsAuthenticated(false);
            setUser(null);
            storage.remove('token');
            storage.remove('refreshToken');

            stateService.updateAuthState({
                isAuthenticated: false,
                user: null,
                role: null,
            });

            // Clear other application state
            stateService.clearState();

            // Redirect to login
            navigate(config.ROUTES.PUBLIC.LOGIN, { replace: true });
        }
    }, [navigate]);

    // Update profile
    const updateProfile = useCallback(async (profileData) => {
        try {
            setIsLoading(true);
            const response = await authService.updateProfile(profileData);

            if (response.success) {
                setUser(response.user);
                stateService.updateAuthState({
                    user: response.user,
                });

                toast({
                    title: 'Profile Updated',
                    description: 'Your profile has been successfully updated',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                return true;
            }

            throw new Error(response.error || 'Profile update failed');
        } catch (error) {
            console.error('Profile update error:', error);
            toast({
                title: 'Update Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Check role
    const hasRole = useCallback((role) => {
        return user?.role === role;
    }, [user]);

    return {
        isLoading,
        isAuthenticated,
        user,
        login,
        register,
        logout: handleLogout,
        updateProfile,
        hasRole,
    };
};

export default useAuth;
