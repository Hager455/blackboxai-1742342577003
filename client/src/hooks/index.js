import { useWeb3 } from './useWeb3';
import { useBiometric } from './useBiometric';
import { useAuth } from './useAuth';
import { useVoting } from './useVoting';
import { useWebcam } from './useWebcam';
import { useToastMessage } from './useToastMessage';

// Export individual hooks
export {
    useWeb3,
    useBiometric,
    useAuth,
    useVoting,
    useWebcam,
    useToastMessage,
};

// Export hook bundle
const hooks = {
    useWeb3,
    useBiometric,
    useAuth,
    useVoting,
    useWebcam,
    useToastMessage,
};

export default hooks;

// Export hook utilities
export const useInitialize = () => {
    const { initialize: initWeb3 } = useWeb3();
    const { initializeVerification } = useBiometric();
    const { isAuthenticated } = useAuth();
    const toast = useToastMessage();

    return async () => {
        try {
            // Initialize Web3
            const web3Success = await initWeb3();
            if (!web3Success) {
                toast.messages.generalError(new Error('Failed to initialize Web3'));
                return false;
            }

            // Initialize biometric verification if authenticated
            if (isAuthenticated) {
                const verificationSession = initializeVerification();
                if (!verificationSession) {
                    toast.messages.generalError(new Error('Failed to initialize verification'));
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Initialization error:', error);
            toast.messages.generalError(error);
            return false;
        }
    };
};

// Export hook helpers
export const hookUtils = {
    // Check if all required hooks are initialized
    isInitialized: (hooks) => {
        const { web3, biometric, auth } = hooks;
        return (
            web3?.isInitialized &&
            (!auth?.isAuthenticated || biometric?.verificationStatus !== null)
        );
    },

    // Get hook status
    getStatus: (hooks) => {
        const { web3, biometric, auth, voting } = hooks;
        return {
            web3: {
                initialized: web3?.isInitialized || false,
                connected: web3?.isConnected || false,
                account: web3?.account || null,
            },
            biometric: {
                initialized: biometric?.verificationStatus !== null,
                verified: biometric?.isVerificationComplete || false,
                progress: biometric?.verificationProgress || 0,
            },
            auth: {
                initialized: !auth?.isLoading,
                authenticated: auth?.isAuthenticated || false,
                user: auth?.user || null,
            },
            voting: {
                hasVoted: voting?.hasVoted || false,
                canVote: voting?.canVote || false,
                totalVotes: voting?.votingStats?.totalVotes || 0,
            },
        };
    },

    // Reset all hooks
    reset: async (hooks) => {
        const { web3, biometric, auth, webcam } = hooks;
        const toast = useToastMessage();

        try {
            // Stop webcam if active
            if (webcam?.stopWebcam) {
                webcam.stopWebcam();
            }

            // Logout user
            if (auth?.logout) {
                await auth.logout();
            }

            // Reset biometric verification
            if (biometric?.resetVerification) {
                biometric.resetVerification();
            }

            // Disconnect wallet
            if (web3?.disconnectWallet) {
                web3.disconnectWallet();
            }

            return true;
        } catch (error) {
            console.error('Hook reset error:', error);
            toast.messages.generalError(error);
            return false;
        }
    },
};

// Export common hook combinations
export const useCombinedAuth = () => {
    const web3 = useWeb3();
    const auth = useAuth();
    const biometric = useBiometric();
    const toast = useToastMessage();

    return {
        ...auth,
        web3,
        biometric,
        toast,
        isFullyAuthenticated: auth.isAuthenticated && biometric.isVerificationComplete,
        isConnected: web3.isConnected,
    };
};

export const useVoter = () => {
    const { user, isAuthenticated } = useAuth();
    const { isVerificationComplete } = useBiometric();
    const { account } = useWeb3();
    const { hasVoted, canVote, votingStats } = useVoting();
    const toast = useToastMessage();

    return {
        isVoter: isAuthenticated && user?.role === 'voter',
        canVote: isAuthenticated && isVerificationComplete && !!account && !hasVoted,
        hasVoted,
        voterInfo: user,
        walletAddress: account,
        votingStats,
        toast,
    };
};

export const useAdmin = () => {
    const { user, isAuthenticated } = useAuth();
    const { account } = useWeb3();
    const { votingStats, loadVotingStats } = useVoting();
    const toast = useToastMessage();

    return {
        isAdmin: isAuthenticated && user?.role === 'admin',
        adminInfo: user,
        walletAddress: account,
        votingStats,
        refreshStats: loadVotingStats,
        toast,
    };
};

// Export specialized hook combinations
export const useVotingProcess = () => {
    const { isAuthenticated, user } = useAuth();
    const { isVerificationComplete, verificationStatus } = useBiometric();
    const { account, isConnected } = useWeb3();
    const voting = useVoting();
    const toast = useToastMessage();

    const votingStatus = {
        canInitiate: isAuthenticated && isConnected && isVerificationComplete && !voting.hasVoted,
        isReady: isAuthenticated && isConnected && isVerificationComplete,
        requiresVerification: isAuthenticated && !isVerificationComplete,
        requiresWallet: isAuthenticated && !isConnected,
        hasVoted: voting.hasVoted,
    };

    return {
        ...voting,
        user,
        account,
        verificationStatus,
        votingStatus,
        toast,
    };
};

export const useVotingStats = () => {
    const { votingStats, loadVotingStats } = useVoting();
    const { isAdmin } = useAdmin();
    const toast = useToastMessage();

    return {
        stats: votingStats,
        refresh: loadVotingStats,
        isAdmin,
        toast,
        metrics: votingStats ? {
            totalVoters: votingStats.totalVoters,
            totalVotes: votingStats.totalVotes,
            participationRate: votingStats.participationRate,
            candidates: votingStats.candidates,
        } : null,
    };
};

// Export biometric verification hook combinations
export const useBiometricVerification = () => {
    const webcam = useWebcam();
    const biometric = useBiometric();
    const { account } = useWeb3();
    const toast = useToastMessage();

    const verifyFaceWithWebcam = async () => {
        try {
            const imageData = await webcam.takePhoto();
            return await biometric.verifyFace(imageData);
        } catch (error) {
            console.error('Face verification error:', error);
            toast.messages.verificationError(error);
            throw error;
        }
    };

    const verifyIrisWithWebcam = async () => {
        try {
            const imageData = await webcam.takePhoto();
            return await biometric.detectIris(imageData);
        } catch (error) {
            console.error('Iris verification error:', error);
            toast.messages.verificationError(error);
            throw error;
        }
    };

    return {
        ...webcam,
        ...biometric,
        verifyFaceWithWebcam,
        verifyIrisWithWebcam,
        walletAddress: account,
        toast,
    };
};
