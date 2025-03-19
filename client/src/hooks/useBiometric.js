import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { biometricService, stateService } from '../services';
import { BIOMETRIC_CONSTANTS } from '../utils/biometricUtils';

export const useBiometric = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const toast = useToast();

    // Initialize verification session
    const initializeVerification = useCallback(() => {
        try {
            const session = biometricService.initializeSession();
            setVerificationStatus(biometricService.getVerificationStatus());
            return session;
        } catch (error) {
            console.error('Verification initialization error:', error);
            toast({
                title: 'Initialization Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return null;
        }
    }, [toast]);

    // Face detection and authentication
    const verifyFace = useCallback(async (imageData) => {
        try {
            setIsProcessing(true);
            const result = await biometricService.verifyFaceAuth(imageData);

            if (result.success) {
                setVerificationStatus(biometricService.getVerificationStatus());
                toast({
                    title: 'Face Verification Successful',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                return result;
            }

            throw new Error('Face verification failed');
        } catch (error) {
            console.error('Face verification error:', error);
            toast({
                title: 'Face Verification Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [toast]);

    // Face recognition
    const recognizeFace = useCallback(async (imageData) => {
        try {
            setIsProcessing(true);
            const result = await biometricService.performFaceRecognition(imageData);

            if (result.success) {
                setVerificationStatus(biometricService.getVerificationStatus());
                toast({
                    title: 'Face Recognition Successful',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                return result;
            }

            throw new Error('Face recognition failed');
        } catch (error) {
            console.error('Face recognition error:', error);
            toast({
                title: 'Face Recognition Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [toast]);

    // Iris detection
    const detectIris = useCallback(async (imageData) => {
        try {
            setIsProcessing(true);
            const result = await biometricService.detectIris(imageData);

            if (result.success) {
                setVerificationStatus(biometricService.getVerificationStatus());
                toast({
                    title: 'Iris Detection Successful',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                return result;
            }

            throw new Error('Iris detection failed');
        } catch (error) {
            console.error('Iris detection error:', error);
            toast({
                title: 'Iris Detection Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [toast]);

    // Iris analysis
    const analyzeIris = useCallback(async (imageData) => {
        try {
            setIsProcessing(true);
            const result = await biometricService.analyzeIris(imageData);

            if (result.success) {
                setVerificationStatus(biometricService.getVerificationStatus());
                toast({
                    title: 'Iris Analysis Successful',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                return result;
            }

            throw new Error('Iris analysis failed');
        } catch (error) {
            console.error('Iris analysis error:', error);
            toast({
                title: 'Iris Analysis Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [toast]);

    // Complete verification
    const completeVerification = useCallback(async (walletAddress) => {
        try {
            setIsProcessing(true);
            const result = await biometricService.completeVerification(walletAddress);

            if (result.success) {
                stateService.updateVerificationState({
                    isVerified: true,
                    verificationId: result.verificationId,
                });

                toast({
                    title: 'Verification Complete',
                    description: 'All biometric checks passed successfully',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });

                return result;
            }

            throw new Error('Verification completion failed');
        } catch (error) {
            console.error('Verification completion error:', error);
            toast({
                title: 'Verification Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [toast]);

    // Reset verification
    const resetVerification = useCallback(() => {
        biometricService.clearSession();
        setVerificationStatus(null);
        stateService.updateVerificationState({
            isVerified: false,
            progress: 0,
            currentStep: null,
        });
    }, []);

    // Update verification status when component mounts
    useEffect(() => {
        const status = biometricService.getVerificationStatus();
        if (status) {
            setVerificationStatus(status);
        }
    }, []);

    return {
        isProcessing,
        verificationStatus,
        constants: BIOMETRIC_CONSTANTS,
        initializeVerification,
        verifyFace,
        recognizeFace,
        detectIris,
        analyzeIris,
        completeVerification,
        resetVerification,
        isVerificationComplete: biometricService.isVerificationComplete(),
        verificationProgress: biometricService.getVerificationProgress(),
    };
};

export default useBiometric;
