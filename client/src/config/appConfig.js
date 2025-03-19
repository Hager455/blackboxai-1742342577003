// Environment-specific configurations
const ENV = process.env.NODE_ENV || 'development';

const ENVIRONMENTS = {
    development: {
        API_URL: 'http://localhost:5000/api',
        BLOCKCHAIN: {
            NETWORK_ID: 11155111, // Sepolia testnet
            NETWORK_NAME: 'Sepolia Test Network',
            BLOCK_EXPLORER: 'https://sepolia.etherscan.io',
            RPC_URL: 'https://sepolia.infura.io/v3/',
        },
    },
    production: {
        API_URL: process.env.REACT_APP_API_URL,
        BLOCKCHAIN: {
            NETWORK_ID: 1, // Ethereum mainnet
            NETWORK_NAME: 'Ethereum Mainnet',
            BLOCK_EXPLORER: 'https://etherscan.io',
            RPC_URL: process.env.REACT_APP_RPC_URL,
        },
    },
    test: {
        API_URL: 'http://localhost:5000/api',
        BLOCKCHAIN: {
            NETWORK_ID: 11155111,
            NETWORK_NAME: 'Sepolia Test Network',
            BLOCK_EXPLORER: 'https://sepolia.etherscan.io',
            RPC_URL: 'https://sepolia.infura.io/v3/',
        },
    },
};

// API endpoints
const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        VERIFY: '/auth/verify',
        REFRESH_TOKEN: '/auth/refresh-token',
    },
    VOTER: {
        PROFILE: '/voter/profile',
        VOTE: '/voter/vote',
        HISTORY: '/voter/history',
    },
    ADMIN: {
        DASHBOARD: '/admin/dashboard',
        CANDIDATES: '/admin/candidates',
        VOTERS: '/admin/voters',
        STATISTICS: '/admin/statistics',
        SETTINGS: '/admin/settings',
    },
    BIOMETRIC: {
        FACE_AUTH: '/verify/face-auth',
        FACE_RECOGNITION: '/verify/face-recognition',
        IRIS_DETECTION: '/verify/iris-detection',
        IRIS_ANALYSIS: '/verify/iris-analysis',
        VERIFY_COMPLETE: '/verify/complete',
    },
};

// Application settings
const APP_SETTINGS = {
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
    },
    TIMEOUTS: {
        API_REQUEST: 30000, // 30 seconds
        SESSION: 3600000, // 1 hour
        TOAST_DURATION: 5000, // 5 seconds
    },
    FILE_LIMITS: {
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png'],
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    },
    SECURITY: {
        PASSWORD_MIN_LENGTH: 8,
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_DURATION: 900000, // 15 minutes
    },
};

// Route configurations
const ROUTES = {
    PUBLIC: {
        HOME: '/',
        LOGIN: '/login',
        REGISTER: '/register',
        ABOUT: '/about',
        CONTACT: '/contact',
    },
    VOTER: {
        DASHBOARD: '/voter/dashboard',
        PROFILE: '/voter/profile',
        VOTE: '/voter/vote',
        VERIFICATION: '/voter/verify',
    },
    ADMIN: {
        DASHBOARD: '/admin/dashboard',
        CANDIDATES: '/admin/candidates',
        VOTERS: '/admin/voters',
        STATISTICS: '/admin/statistics',
        SETTINGS: '/admin/settings',
    },
};

// Theme configurations
const THEME = {
    COLORS: {
        primary: {
            50: '#E6F6FF',
            100: '#BAE3FF',
            200: '#7CC4FA',
            300: '#47A3F3',
            400: '#2186EB',
            500: '#0967D2',
            600: '#0552B5',
            700: '#03449E',
            800: '#01337D',
            900: '#002159',
        },
        error: '#DC2626',
        success: '#059669',
        warning: '#D97706',
        info: '#2563EB',
    },
    FONTS: {
        body: 'Inter, system-ui, sans-serif',
        heading: 'Inter, system-ui, sans-serif',
        mono: 'Menlo, monospace',
    },
    BREAKPOINTS: {
        sm: '30em',
        md: '48em',
        lg: '62em',
        xl: '80em',
        '2xl': '96em',
    },
};

// Blockchain configurations
const BLOCKCHAIN = {
    CONTRACTS: {
        VOTING: {
            NAME: 'VotingContract',
            EVENTS: {
                VOTE_CAST: 'VoteCast',
                VOTER_REGISTERED: 'VoterRegistered',
                CANDIDATE_ADDED: 'CandidateAdded',
            },
        },
    },
    GAS: {
        LIMIT: 3000000,
        PRICE_MULTIPLIER: 1.2, // 20% buffer
    },
    CONFIRMATIONS: {
        DEFAULT: 1,
        REQUIRED: 3,
    },
};

// Export configurations
export const config = {
    ENV,
    ...ENVIRONMENTS[ENV],
    API_ENDPOINTS,
    APP_SETTINGS,
    ROUTES,
    THEME,
    BLOCKCHAIN,
};

// Export individual configurations for specific uses
export {
    API_ENDPOINTS,
    APP_SETTINGS,
    ROUTES,
    THEME,
    BLOCKCHAIN,
};

export default config;
