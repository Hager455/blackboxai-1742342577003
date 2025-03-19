import { Subject } from 'rxjs';
import { storage } from '../utils/appUtils';
import { config } from '../config/appConfig';

class StateService {
    constructor() {
        // Event subjects
        this.authState$ = new Subject();
        this.votingState$ = new Subject();
        this.verificationState$ = new Subject();
        this.networkState$ = new Subject();
        this.errorState$ = new Subject();

        // Application state
        this.state = {
            auth: {
                isAuthenticated: false,
                user: null,
                role: null,
            },
            voting: {
                isActive: false,
                hasVoted: false,
                candidates: [],
                statistics: null,
            },
            verification: {
                isVerified: false,
                progress: 0,
                currentStep: null,
            },
            network: {
                isConnected: false,
                chainId: null,
                account: null,
            },
            settings: this.loadSettings(),
        };

        // Initialize state from storage
        this.initializeState();
    }

    // Initialize application state
    initializeState() {
        // Load auth state
        const authData = storage.get('authState');
        if (authData) {
            this.updateAuthState(authData);
        }

        // Load voting state
        const votingData = storage.get('votingState');
        if (votingData) {
            this.updateVotingState(votingData);
        }

        // Load verification state
        const verificationData = storage.get('verificationState');
        if (verificationData) {
            this.updateVerificationState(verificationData);
        }
    }

    // Load application settings
    loadSettings() {
        return storage.get('appSettings') || {
            theme: 'light',
            language: 'en',
            notifications: true,
            autoConnect: true,
        };
    }

    // Update authentication state
    updateAuthState(authData) {
        this.state.auth = {
            ...this.state.auth,
            ...authData,
        };
        storage.set('authState', this.state.auth);
        this.authState$.next(this.state.auth);
    }

    // Update voting state
    updateVotingState(votingData) {
        this.state.voting = {
            ...this.state.voting,
            ...votingData,
        };
        storage.set('votingState', this.state.voting);
        this.votingState$.next(this.state.voting);
    }

    // Update verification state
    updateVerificationState(verificationData) {
        this.state.verification = {
            ...this.state.verification,
            ...verificationData,
        };
        storage.set('verificationState', this.state.verification);
        this.verificationState$.next(this.state.verification);
    }

    // Update network state
    updateNetworkState(networkData) {
        this.state.network = {
            ...this.state.network,
            ...networkData,
        };
        this.networkState$.next(this.state.network);
    }

    // Update application settings
    updateSettings(settings) {
        this.state.settings = {
            ...this.state.settings,
            ...settings,
        };
        storage.set('appSettings', this.state.settings);
    }

    // Clear all state
    clearState() {
        // Clear state objects
        this.state = {
            auth: {
                isAuthenticated: false,
                user: null,
                role: null,
            },
            voting: {
                isActive: false,
                hasVoted: false,
                candidates: [],
                statistics: null,
            },
            verification: {
                isVerified: false,
                progress: 0,
                currentStep: null,
            },
            network: {
                isConnected: false,
                chainId: null,
                account: null,
            },
            settings: this.loadSettings(),
        };

        // Clear storage
        storage.remove('authState');
        storage.remove('votingState');
        storage.remove('verificationState');

        // Emit state changes
        this.authState$.next(this.state.auth);
        this.votingState$.next(this.state.voting);
        this.verificationState$.next(this.state.verification);
        this.networkState$.next(this.state.network);
    }

    // Error handling
    emitError(error) {
        this.errorState$.next({
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error : new Error(error),
        });
    }

    // Get current state
    getState() {
        return { ...this.state };
    }

    // Subscribe to state changes
    subscribe(stateType, callback) {
        switch (stateType) {
            case 'auth':
                return this.authState$.subscribe(callback);
            case 'voting':
                return this.votingState$.subscribe(callback);
            case 'verification':
                return this.verificationState$.subscribe(callback);
            case 'network':
                return this.networkState$.subscribe(callback);
            case 'error':
                return this.errorState$.subscribe(callback);
            default:
                throw new Error(`Invalid state type: ${stateType}`);
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.state.auth.isAuthenticated;
    }

    // Check if user has verified their identity
    isVerified() {
        return this.state.verification.isVerified;
    }

    // Check if user has voted
    hasVoted() {
        return this.state.voting.hasVoted;
    }

    // Check if voting is active
    isVotingActive() {
        return this.state.voting.isActive;
    }

    // Check if wallet is connected
    isWalletConnected() {
        return this.state.network.isConnected && !!this.state.network.account;
    }

    // Get user role
    getUserRole() {
        return this.state.auth.role;
    }

    // Get current theme
    getTheme() {
        return this.state.settings.theme;
    }

    // Get application settings
    getSettings() {
        return { ...this.state.settings };
    }
}

export const stateService = new StateService();
export default stateService;
