// Constants for biometric validation
export const BIOMETRIC_CONSTANTS = {
    FACE_DETECTION: {
        MIN_CONFIDENCE: 0.85,
        MAX_FACES: 1,
        MIN_FACE_SIZE: 150,
        ALLOWED_POSES: ['frontal', 'slight-left', 'slight-right'],
    },
    IRIS_DETECTION: {
        MIN_CONFIDENCE: 0.90,
        MIN_IRIS_SIZE: 100,
        MAX_IRIS_SIZE: 300,
        QUALITY_THRESHOLD: 0.75,
    },
    IMAGE_REQUIREMENTS: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png'],
        MIN_RESOLUTION: { width: 640, height: 480 },
        MAX_RESOLUTION: { width: 1920, height: 1080 },
    },
};

// Validate image file before processing
export const validateImageFile = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

        // Check file size
        if (file.size > BIOMETRIC_CONSTANTS.IMAGE_REQUIREMENTS.MAX_SIZE) {
            reject(new Error('File size exceeds maximum allowed size (5MB)'));
            return;
        }

        // Check file type
        if (!BIOMETRIC_CONSTANTS.IMAGE_REQUIREMENTS.ALLOWED_TYPES.includes(file.type)) {
            reject(new Error('Invalid file type. Only JPEG and PNG files are allowed'));
            return;
        }

        // Check image dimensions
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            const { MIN_RESOLUTION, MAX_RESOLUTION } = BIOMETRIC_CONSTANTS.IMAGE_REQUIREMENTS;

            if (img.width < MIN_RESOLUTION.width || img.height < MIN_RESOLUTION.height) {
                reject(new Error('Image resolution is too low'));
                return;
            }

            if (img.width > MAX_RESOLUTION.width || img.height > MAX_RESOLUTION.height) {
                reject(new Error('Image resolution is too high'));
                return;
            }

            resolve(true);
        };

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Invalid image file'));
        };

        img.src = URL.createObjectURL(file);
    });
};

// Convert image file to base64
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// Process webcam frame for face detection
export const processWebcamFrame = (videoElement, canvasElement) => {
    return new Promise((resolve) => {
        const context = canvasElement.getContext('2d');
        
        // Match canvas dimensions to video
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        // Draw video frame to canvas
        context.drawImage(videoElement, 0, 0);

        // Convert to base64
        const imageData = canvasElement.toDataURL('image/jpeg');
        resolve(imageData);
    });
};

// Calculate face detection score
export const calculateFaceScore = (detectionResult) => {
    const { confidence, pose, faceSize } = detectionResult;
    
    let score = 0;
    const weights = {
        confidence: 0.4,
        pose: 0.3,
        size: 0.3,
    };

    // Confidence score
    if (confidence >= BIOMETRIC_CONSTANTS.FACE_DETECTION.MIN_CONFIDENCE) {
        score += weights.confidence;
    }

    // Pose score
    if (BIOMETRIC_CONSTANTS.FACE_DETECTION.ALLOWED_POSES.includes(pose)) {
        score += weights.pose;
    }

    // Face size score
    if (faceSize >= BIOMETRIC_CONSTANTS.FACE_DETECTION.MIN_FACE_SIZE) {
        score += weights.size;
    }

    return score;
};

// Calculate iris detection score
export const calculateIrisScore = (detectionResult) => {
    const { confidence, irisSize, quality } = detectionResult;
    
    let score = 0;
    const weights = {
        confidence: 0.4,
        size: 0.3,
        quality: 0.3,
    };

    // Confidence score
    if (confidence >= BIOMETRIC_CONSTANTS.IRIS_DETECTION.MIN_CONFIDENCE) {
        score += weights.confidence;
    }

    // Size score
    const { MIN_IRIS_SIZE, MAX_IRIS_SIZE } = BIOMETRIC_CONSTANTS.IRIS_DETECTION;
    if (irisSize >= MIN_IRIS_SIZE && irisSize <= MAX_IRIS_SIZE) {
        score += weights.size;
    }

    // Quality score
    if (quality >= BIOMETRIC_CONSTANTS.IRIS_DETECTION.QUALITY_THRESHOLD) {
        score += weights.quality;
    }

    return score;
};

// Validate verification session
export const validateVerificationSession = (session) => {
    const requiredSteps = ['faceDetection', 'faceRecognition', 'irisDetection', 'irisAnalysis'];
    const completedSteps = Object.keys(session).filter(step => session[step].completed);
    
    return {
        isComplete: requiredSteps.every(step => completedSteps.includes(step)),
        completedSteps: completedSteps,
        remainingSteps: requiredSteps.filter(step => !completedSteps.includes(step)),
        progress: (completedSteps.length / requiredSteps.length) * 100
    };
};

// Generate verification hash
export const generateVerificationHash = (verificationData) => {
    const { faceData, irisData, timestamp, walletAddress } = verificationData;
    
    // Combine all verification data
    const combinedData = `${faceData}:${irisData}:${timestamp}:${walletAddress}`;
    
    // Use Web Crypto API to generate hash
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(combinedData))
        .then(hashBuffer => {
            // Convert hash buffer to hex string
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        });
};

// Format verification result for display
export const formatVerificationResult = (result) => {
    return {
        status: result.success ? 'success' : 'failed',
        timestamp: new Date().toISOString(),
        details: {
            faceScore: result.faceScore?.toFixed(2) || 0,
            irisScore: result.irisScore?.toFixed(2) || 0,
            overallConfidence: result.confidence?.toFixed(2) || 0,
        },
        verificationId: result.verificationId || null,
    };
};
