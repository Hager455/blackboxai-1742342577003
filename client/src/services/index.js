import apiService, { 
    authService, 
    voterService, 
    adminService, 
    biometricService as apiBiometricService 
} from './apiService';

import contractService from './contractService';
import biometricService from './biometricService';
import stateService from './stateService';

// Export individual services
export {
    apiService,
    authService,
    voterService,
    adminService,
    apiBiometricService,
    contractService,
    biometricService,
    stateService,
};

// Export service bundle
const services = {
    api: apiService,
    auth: authService,
    voter: voterService,
    admin: adminService,
    contract: contractService,
    biometric: biometricService,
    state: stateService,
};

export default services;

// Export service initialization function
export const initializeServices = async () => {
    try {
        // Initialize contract service
        await contractService.initialize();

        // Initialize biometric service
        const verificationSession = biometricService.getSession();
        if (!verificationSession) {
            biometricService.initializeSession();
        }

        // Update state service with network info
        stateService.updateNetworkState({
            isConnected: true,
            chainId: await contractService.web3.eth.getChainId(),
            account: contractService.account,
        });

        return true;
    } catch (error) {
        console.error('Service initialization error:', error);
        throw error;
    }
};

// Export service cleanup function
export const cleanupServices = () => {
    try {
        // Clear biometric session
        biometricService.clearSession();

        // Clear application state
        stateService.clearState();

        return true;
    } catch (error) {
        console.error('Service cleanup error:', error);
        throw error;
    }
};

// Export service event handlers
export const serviceEventHandlers = {
    // Handle account changes
    handleAccountsChanged: (accounts) => {
        if (accounts.length === 0) {
            stateService.updateNetworkState({
                isConnected: false,
                account: null,
            });
        } else {
            stateService.updateNetworkState({
                isConnected: true,
                account: accounts[0],
            });
        }
    },

    // Handle network changes
    handleChainChanged: async (chainId) => {
        stateService.updateNetworkState({
            chainId: parseInt(chainId, 16),
        });
    },

    // Handle connection events
    handleConnect: (connectInfo) => {
        stateService.updateNetworkState({
            isConnected: true,
            chainId: parseInt(connectInfo.chainId, 16),
        });
    },

    // Handle disconnection events
    handleDisconnect: (error) => {
        stateService.updateNetworkState({
            isConnected: false,
            chainId: null,
            account: null,
        });

        if (error) {
            stateService.emitError(error);
        }
    },
};

// Export service utility functions
export const serviceUtils = {
    // Check if all required services are initialized
    isInitialized: () => {
        return (
            contractService.web3 !== null &&
            biometricService.getSession() !== null &&
            stateService.isWalletConnected()
        );
    },

    // Get service status
    getStatus: () => {
        return {
            contract: {
                initialized: contractService.web3 !== null,
                connected: stateService.isWalletConnected(),
                network: stateService.getState().network,
            },
            biometric: {
                initialized: biometricService.getSession() !== null,
                verified: stateService.isVerified(),
                progress: biometricService.getVerificationProgress(),
            },
            auth: {
                authenticated: stateService.isAuthenticated(),
                role: stateService.getUserRole(),
            },
        };
    },

    // Reset all services
    reset: async () => {
        await cleanupServices();
        return initializeServices();
    },
};
