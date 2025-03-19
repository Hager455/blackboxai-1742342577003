import { apiService } from './apiService';
import { 
    validateImageFile, 
    fileToBase64, 
    processWebcamFrame,
    calculateFaceScore,
    calculateIrisScore,
    generateVerificationHash
} from '../utils/biometricUtils';
import { BIOMETRIC_CONSTANTS } from '../utils/biometricUtils';
import { storage } from '../utils/appUtils';

class BiometricService {
    constructor() {
        this.verificationSession = null;
    }

    // Initialize a new verification session
    initializeSession() {
        this.verificationSession = {
            id: crypto.randomUUID(),
            startTime: new Date().toISOString(),
            steps: {
                faceDetection: { completed: false, score: 0 },
                faceRecognition: { completed: false, score: 0 },
                irisDetection: { completed: false, score: 0 },
                irisAnalysis: { completed: false, score: 0 }
            },
            images: {
                face: null,
                iris: null
            },
            verificationHash: null
        };

        storage.set('verificationSession', this.verificationSession);
        return this.verificationSession;
    }

    // Get current verification session
    getSession() {
        if (!this.verificationSession) {
            const savedSession = storage.get('verificationSession');
            if (savedSession) {
                this.verificationSession = savedSession;
            }
        }
        return this.verificationSession;
    }

    // Face detection and authentication
    async verifyFaceAuth(imageData) {
        try {
            // Validate image data
            if (imageData instanceof File) {
                await validateImageFile(imageData);
                imageData = await fileToBase64(imageData);
            }

            // Process face detection
            const response = await apiService.biometric.verifyFaceAuth(imageData);

            if (response.success) {
                const score = calculateFaceScore(response.detection);
                
                // Update session
                this.verificationSession.steps.faceDetection = {
                    completed: true,
                    score,
                    timestamp: new Date().toISOString()
                };
                this.verificationSession.images.face = imageData;
                
                storage.set('verificationSession', this.verificationSession);

                return {
                    success: true,
                    score,
                    detection: response.detection
                };
            }

            throw new Error(response.error || 'Face authentication failed');
        } catch (error) {
            console.error('Face authentication error:', error);
            throw error;
        }
    }

    // Face recognition
    async performFaceRecognition(imageData) {
        try {
            if (!this.verificationSession?.steps.faceDetection.completed) {
                throw new Error('Face detection must be completed first');
            }

            const response = await apiService.biometric.performFaceRecognition(imageData);

            if (response.success) {
                // Update session
                this.verificationSession.steps.faceRecognition = {
                    completed: true,
                    score: response.confidence,
                    timestamp: new Date().toISOString()
                };
                
                storage.set('verificationSession', this.verificationSession);

                return {
                    success: true,
                    confidence: response.confidence,
                    verificationId: response.verificationId
                };
            }

            throw new Error(response.error || 'Face recognition failed');
        } catch (error) {
            console.error('Face recognition error:', error);
            throw error;
        }
    }

    // Iris detection
    async detectIris(imageData) {
        try {
            if (!this.verificationSession?.steps.faceRecognition.completed) {
                throw new Error('Face recognition must be completed first');
            }

            // Validate image data
            if (imageData instanceof File) {
                await validateImageFile(imageData);
                imageData = await fileToBase64(imageData);
            }

            const response = await apiService.biometric.detectIris(imageData);

            if (response.success) {
                const score = calculateIrisScore(response.detection);

                // Update session
                this.verificationSession.steps.irisDetection = {
                    completed: true,
                    score,
                    timestamp: new Date().toISOString()
                };
                this.verificationSession.images.iris = imageData;
                
                storage.set('verificationSession', this.verificationSession);

                return {
                    success: true,
                    score,
                    detection: response.detection
                };
            }

            throw new Error(response.error || 'Iris detection failed');
        } catch (error) {
            console.error('Iris detection error:', error);
            throw error;
        }
    }

    // Iris analysis
    async analyzeIris(imageData) {
        try {
            if (!this.verificationSession?.steps.irisDetection.completed) {
                throw new Error('Iris detection must be completed first');
            }

            const response = await apiService.biometric.analyzeIris(imageData);

            if (response.success) {
                // Update session
                this.verificationSession.steps.irisAnalysis = {
                    completed: true,
                    score: response.confidence,
                    timestamp: new Date().toISOString()
                };
                
                storage.set('verificationSession', this.verificationSession);

                return {
                    success: true,
                    confidence: response.confidence,
                    analysisId: response.analysisId
                };
            }

            throw new Error(response.error || 'Iris analysis failed');
        } catch (error) {
            console.error('Iris analysis error:', error);
            throw error;
        }
    }

    // Complete verification process
    async completeVerification(walletAddress) {
        try {
            if (!this.isVerificationComplete()) {
                throw new Error('All verification steps must be completed');
            }

            // Generate verification hash
            const verificationHash = await generateVerificationHash({
                faceData: this.verificationSession.images.face,
                irisData: this.verificationSession.images.iris,
                timestamp: new Date().toISOString(),
                walletAddress
            });

            this.verificationSession.verificationHash = verificationHash;

            const response = await apiService.biometric.completeVerification({
                sessionId: this.verificationSession.id,
                verificationHash,
                walletAddress,
                steps: this.verificationSession.steps
            });

            if (response.success) {
                // Clear session after successful verification
                this.clearSession();
                return response;
            }

            throw new Error(response.error || 'Verification completion failed');
        } catch (error) {
            console.error('Verification completion error:', error);
            throw error;
        }
    }

    // Check if all verification steps are complete
    isVerificationComplete() {
        if (!this.verificationSession) return false;

        return Object.values(this.verificationSession.steps)
            .every(step => step.completed);
    }

    // Get verification progress
    getVerificationProgress() {
        if (!this.verificationSession) return 0;

        const completedSteps = Object.values(this.verificationSession.steps)
            .filter(step => step.completed).length;
        
        return (completedSteps / 4) * 100;
    }

    // Clear verification session
    clearSession() {
        this.verificationSession = null;
        storage.remove('verificationSession');
    }

    // Get verification status
    getVerificationStatus() {
        const session = this.getSession();
        if (!session) return null;

        return {
            sessionId: session.id,
            progress: this.getVerificationProgress(),
            steps: session.steps,
            startTime: session.startTime,
            isComplete: this.isVerificationComplete()
        };
    }
}

export const biometricService = new BiometricService();
export default biometricService;
