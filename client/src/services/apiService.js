import axios from 'axios';
import { config } from '../config/appConfig';
import { storage } from '../utils/appUtils';
import { errorHandler } from '../utils/appUtils';

// Create axios instance with default config
const api = axios.create({
    baseURL: config.API_URL,
    timeout: config.APP_SETTINGS.TIMEOUTS.API_REQUEST,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = storage.get('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        // Handle token refresh
        if (error.response?.status === 401 && !error.config._retry) {
            error.config._retry = true;
            try {
                const refreshToken = storage.get('refreshToken');
                const response = await api.post(config.API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
                    refreshToken,
                });
                storage.set('token', response.token);
                error.config.headers.Authorization = `Bearer ${response.token}`;
                return api(error.config);
            } catch (refreshError) {
                storage.remove('token');
                storage.remove('refreshToken');
                window.location.href = config.ROUTES.PUBLIC.LOGIN;
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(errorHandler.getErrorMessage(error));
    }
);

// Auth services
export const authService = {
    login: async (credentials) => {
        const response = await api.post(config.API_ENDPOINTS.AUTH.LOGIN, credentials);
        if (response.token) {
            storage.set('token', response.token);
            storage.set('refreshToken', response.refreshToken);
        }
        return response;
    },

    register: async (userData) => {
        return await api.post(config.API_ENDPOINTS.AUTH.REGISTER, userData);
    },

    logout: async () => {
        const response = await api.post(config.API_ENDPOINTS.AUTH.LOGOUT);
        storage.remove('token');
        storage.remove('refreshToken');
        return response;
    },

    verifyToken: async () => {
        return await api.post(config.API_ENDPOINTS.AUTH.VERIFY);
    },
};

// Voter services
export const voterService = {
    getProfile: async () => {
        return await api.get(config.API_ENDPOINTS.VOTER.PROFILE);
    },

    updateProfile: async (profileData) => {
        return await api.put(config.API_ENDPOINTS.VOTER.PROFILE, profileData);
    },

    castVote: async (voteData) => {
        return await api.post(config.API_ENDPOINTS.VOTER.VOTE, voteData);
    },

    getVotingHistory: async () => {
        return await api.get(config.API_ENDPOINTS.VOTER.HISTORY);
    },
};

// Admin services
export const adminService = {
    getDashboardStats: async () => {
        return await api.get(config.API_ENDPOINTS.ADMIN.DASHBOARD);
    },

    // Candidate management
    getCandidates: async (params) => {
        return await api.get(config.API_ENDPOINTS.ADMIN.CANDIDATES, { params });
    },

    addCandidate: async (candidateData) => {
        return await api.post(config.API_ENDPOINTS.ADMIN.CANDIDATES, candidateData);
    },

    updateCandidate: async (id, candidateData) => {
        return await api.put(`${config.API_ENDPOINTS.ADMIN.CANDIDATES}/${id}`, candidateData);
    },

    deleteCandidate: async (id) => {
        return await api.delete(`${config.API_ENDPOINTS.ADMIN.CANDIDATES}/${id}`);
    },

    // Voter management
    getVoters: async (params) => {
        return await api.get(config.API_ENDPOINTS.ADMIN.VOTERS, { params });
    },

    verifyVoter: async (id) => {
        return await api.post(`${config.API_ENDPOINTS.ADMIN.VOTERS}/${id}/verify`);
    },

    // Statistics
    getStatistics: async (params) => {
        return await api.get(config.API_ENDPOINTS.ADMIN.STATISTICS, { params });
    },

    // Settings
    getSettings: async () => {
        return await api.get(config.API_ENDPOINTS.ADMIN.SETTINGS);
    },

    updateSettings: async (settings) => {
        return await api.put(config.API_ENDPOINTS.ADMIN.SETTINGS, settings);
    },
};

// Biometric verification services
export const biometricService = {
    verifyFaceAuth: async (imageData) => {
        return await api.post(config.API_ENDPOINTS.BIOMETRIC.FACE_AUTH, { image: imageData });
    },

    performFaceRecognition: async (imageData) => {
        return await api.post(config.API_ENDPOINTS.BIOMETRIC.FACE_RECOGNITION, { image: imageData });
    },

    detectIris: async (imageData) => {
        return await api.post(config.API_ENDPOINTS.BIOMETRIC.IRIS_DETECTION, { image: imageData });
    },

    analyzeIris: async (imageData) => {
        return await api.post(config.API_ENDPOINTS.BIOMETRIC.IRIS_ANALYSIS, { image: imageData });
    },

    completeVerification: async (verificationData) => {
        return await api.post(config.API_ENDPOINTS.BIOMETRIC.VERIFY_COMPLETE, verificationData);
    },
};

// Export all services
export const apiService = {
    auth: authService,
    voter: voterService,
    admin: adminService,
    biometric: biometricService,
};

export default apiService;
