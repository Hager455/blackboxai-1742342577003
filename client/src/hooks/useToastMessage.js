import { useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

export const useToastMessage = () => {
    const toast = useToast();

    // Success toast
    const showSuccess = useCallback((title, description = '') => {
        toast({
            title,
            description,
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top',
        });
    }, [toast]);

    // Error toast
    const showError = useCallback((title, description = '') => {
        toast({
            title,
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: 'top',
        });
    }, [toast]);

    // Warning toast
    const showWarning = useCallback((title, description = '') => {
        toast({
            title,
            description,
            status: 'warning',
            duration: 4000,
            isClosable: true,
            position: 'top',
        });
    }, [toast]);

    // Info toast
    const showInfo = useCallback((title, description = '') => {
        toast({
            title,
            description,
            status: 'info',
            duration: 3000,
            isClosable: true,
            position: 'top',
        });
    }, [toast]);

    // Loading toast
    const showLoading = useCallback((title, description = '') => {
        return toast({
            title,
            description,
            status: 'loading',
            duration: null,
            isClosable: false,
            position: 'top',
        });
    }, [toast]);

    // Transaction toast
    const showTransaction = useCallback((hash, network = 'sepolia') => {
        const explorerUrl = `https://${network}.etherscan.io/tx/${hash}`;
        toast({
            title: 'Transaction Sent',
            description: (
                <>
                    Transaction hash: {hash.slice(0, 6)}...{hash.slice(-4)}
                    <br />
                    <a 
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'blue.500', textDecoration: 'underline' }}
                    >
                        View on Etherscan
                    </a>
                </>
            ),
            status: 'info',
            duration: 6000,
            isClosable: true,
            position: 'top',
        });
    }, [toast]);

    // Update toast
    const updateToast = useCallback((toastId, options) => {
        toast.update(toastId, options);
    }, [toast]);

    // Close toast
    const closeToast = useCallback((toastId) => {
        toast.close(toastId);
    }, [toast]);

    // Predefined toast messages
    const messages = {
        // Authentication
        loginSuccess: () => showSuccess(
            'Login Successful',
            'Welcome back!'
        ),
        loginError: (error) => showError(
            'Login Failed',
            error?.message || 'Please check your credentials and try again'
        ),
        logoutSuccess: () => showInfo(
            'Logged Out',
            'You have been successfully logged out'
        ),
        registrationSuccess: () => showSuccess(
            'Registration Successful',
            'Please verify your email to continue'
        ),
        registrationError: (error) => showError(
            'Registration Failed',
            error?.message || 'Please check your information and try again'
        ),

        // Wallet
        walletConnected: (address) => showSuccess(
            'Wallet Connected',
            `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`
        ),
        walletError: (error) => showError(
            'Wallet Error',
            error?.message || 'Failed to connect wallet'
        ),
        networkError: () => showWarning(
            'Wrong Network',
            'Please switch to Sepolia Test Network'
        ),

        // Biometric
        verificationSuccess: () => showSuccess(
            'Verification Complete',
            'Biometric verification successful'
        ),
        verificationError: (error) => showError(
            'Verification Failed',
            error?.message || 'Please try again'
        ),
        cameraError: () => showError(
            'Camera Error',
            'Failed to access camera. Please check permissions'
        ),

        // Voting
        voteSuccess: () => showSuccess(
            'Vote Cast Successfully',
            'Your vote has been recorded on the blockchain'
        ),
        voteError: (error) => showError(
            'Voting Failed',
            error?.message || 'Failed to cast vote'
        ),
        alreadyVoted: () => showWarning(
            'Already Voted',
            'You have already cast your vote'
        ),

        // Transaction
        transactionSent: (hash) => showTransaction(hash),
        transactionSuccess: () => showSuccess(
            'Transaction Confirmed',
            'Your transaction has been confirmed'
        ),
        transactionError: (error) => showError(
            'Transaction Failed',
            error?.message || 'Please try again'
        ),

        // General
        generalError: (error) => showError(
            'Error',
            error?.message || 'An unexpected error occurred'
        ),
        generalSuccess: (message) => showSuccess(
            'Success',
            message
        ),
        generalWarning: (message) => showWarning(
            'Warning',
            message
        ),
        generalInfo: (message) => showInfo(
            'Information',
            message
        ),
    };

    return {
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showLoading,
        showTransaction,
        updateToast,
        closeToast,
        messages,
    };
};

export default useToastMessage;
