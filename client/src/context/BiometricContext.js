import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

const BiometricContext = createContext(null);

export const useBiometric = () => {
    const context = useContext(BiometricContext);
    if (!context) {
        throw new Error('useBiometric must be used within a BiometricProvider');
    }
    return context;
};

export const BiometricProvider = ({ children }) => {
    const [verificationState, setVerificationState] = useState({
        faceDetected: false,
        faceRecognized: false,
        irisDetected: false,
        irisAnalyzed: false,
        verificationId: null,
        images: {
            face: null,
            iris: null
        }
    });
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // Verify face authenticity
    const verifyFaceAuth = useCallback(async (imageData) => {
        setLoading(true);
        try {
            const response = await fetch('/api/verify/face-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData }),
            });

            const result = await response.json();

            if (result.success) {
                setVerificationState(prev => ({
                    ...prev,
                    faceDetected: true,
                    images: { ...prev.images, face: imageData }
                }));

                toast({
                    title: 'Face Authentication Successful',
                    description: 'Real face detected',
                    status: 'success',
                    duration: 3000,
                });

                return true;
            } else {
                throw new Error(result.error || 'Face authentication failed');
            }
        } catch (error) {
            toast({
                title: 'Face Authentication Failed',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Perform face recognition
    const performFaceRecognition = useCallback(async (imageData) => {
        setLoading(true);
        try {
            const response = await fetch('/api/verify/face-recognition', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData }),
            });

            const result = await response.json();

            if (result.success) {
                setVerificationState(prev => ({
                    ...prev,
                    faceRecognized: true,
                    verificationId: result.verificationId
                }));

                toast({
                    title: 'Face Recognition Successful',
                    status: 'success',
                    duration: 3000,
                });

                return true;
            } else {
                throw new Error(result.error || 'Face recognition failed');
            }
        } catch (error) {
            toast({
                title: 'Face Recognition Failed',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Detect iris
    const detectIris = useCallback(async (imageData) => {
        setLoading(true);
        try {
            const response = await fetch('/api/verify/iris-detection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData }),
            });

            const result = await response.json();

            if (result.success) {
                setVerificationState(prev => ({
                    ...prev,
                    irisDetected: true,
                    images: { ...prev.images, iris: imageData }
                }));

                toast({
                    title: 'Iris Detection Successful',
                    status: 'success',
                    duration: 3000,
                });

                return true;
            } else {
                throw new Error(result.error || 'Iris detection failed');
            }
        } catch (error) {
            toast({
                title: 'Iris Detection Failed',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Analyze iris
    const analyzeIris = useCallback(async (imageData) => {
        setLoading(true);
        try {
            const response = await fetch('/api/verify/iris-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData }),
            });

            const result = await response.json();

            if (result.success) {
                setVerificationState(prev => ({
                    ...prev,
                    irisAnalyzed: true
                }));

                toast({
                    title: 'Iris Analysis Successful',
                    status: 'success',
                    duration: 3000,
                });

                return true;
            } else {
                throw new Error(result.error || 'Iris analysis failed');
            }
        } catch (error) {
            toast({
                title: 'Iris Analysis Failed',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Complete verification process
    const completeVerification = useCallback(async () => {
        if (!verificationState.verificationId) {
            throw new Error('Verification ID not found');
        }

        try {
            const response = await fetch('/api/verify/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    verificationId: verificationState.verificationId,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: 'Verification Complete',
                    description: 'All biometric checks passed',
                    status: 'success',
                    duration: 5000,
                });
                return true;
            } else {
                throw new Error(result.error || 'Verification completion failed');
            }
        } catch (error) {
            toast({
                title: 'Verification Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
            });
            return false;
        }
    }, [verificationState.verificationId, toast]);

    // Reset verification state
    const resetVerification = useCallback(() => {
        setVerificationState({
            faceDetected: false,
            faceRecognized: false,
            irisDetected: false,
            irisAnalyzed: false,
            verificationId: null,
            images: {
                face: null,
                iris: null
            }
        });
    }, []);

    const value = {
        verificationState,
        loading,
        verifyFaceAuth,
        performFaceRecognition,
        detectIris,
        analyzeIris,
        completeVerification,
        resetVerification
    };

    return (
        <BiometricContext.Provider value={value}>
            {children}
        </BiometricContext.Provider>
    );
};

export default BiometricContext;
