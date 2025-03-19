from pathlib import Path
import torch

# Base Configuration
BASE_CONFIG = {
    'seed': 42,
    'device': 'cuda' if torch.cuda.is_available() else 'cpu',
    'num_workers': 4,
    'pin_memory': True,
}

# Paths Configuration
PATHS = {
    'data_dir': Path('/content/drive/MyDrive/biometric_verification/datasets'),
    'models_dir': Path('/content/drive/MyDrive/biometric_verification/models'),
    'logs_dir': Path('/content/drive/MyDrive/biometric_verification/logs'),
    'output_dir': Path('/content/drive/MyDrive/biometric_verification/outputs'),
}

# Face Spoof Detection Configuration
FACE_SPOOF_CONFIG = {
    'model': {
        'name': 'CDCN++',
        'backbone': 'resnet50',
        'pretrained': True,
        'input_size': (256, 256),
        'num_classes': 1,
    },
    'training': {
        'epochs': 50,
        'batch_size': 32,
        'learning_rate': 1e-4,
        'weight_decay': 1e-5,
        'scheduler': 'cosine',
        'warmup_epochs': 5,
    },
    'augmentation': {
        'rotation_range': 20,
        'brightness_range': (0.8, 1.2),
        'contrast_range': (0.8, 1.2),
        'horizontal_flip': True,
    },
    'threshold': {
        'spoof_confidence': 0.95,  # High confidence required for real face detection
    }
}

# Face Recognition Configuration
FACE_RECOGNITION_CONFIG = {
    'model': {
        'name': 'ArcFace',
        'backbone': 'resnet152',
        'embedding_size': 512,
        'pretrained': True,
        'margin': 0.5,
        'scale': 64,
    },
    'training': {
        'epochs': 100,
        'batch_size': 64,
        'learning_rate': 1e-3,
        'weight_decay': 5e-4,
        'scheduler': 'step',
        'step_size': 10,
        'gamma': 0.1,
    },
    'mining': {
        'strategy': 'hard_triplet',
        'margin': 0.3,
        'min_distance': 0.4,
    },
    'threshold': {
        'similarity_threshold': 0.85,  # High threshold for face matching
    }
}

# Iris Detection Configuration
IRIS_DETECTION_CONFIG = {
    'model': {
        'name': 'UNet++',
        'encoder': 'efficientnet-b4',
        'pretrained': True,
        'input_size': (320, 320),
        'num_classes': 1,
    },
    'training': {
        'epochs': 75,
        'batch_size': 16,
        'learning_rate': 2e-4,
        'weight_decay': 1e-4,
        'scheduler': 'reduce_on_plateau',
        'patience': 5,
    },
    'augmentation': {
        'rotation_range': 10,
        'scale_range': (0.9, 1.1),
        'elastic_transform': True,
    },
    'threshold': {
        'detection_confidence': 0.90,  # High confidence for iris detection
        'quality_threshold': 0.85,  # Minimum quality score for accepted iris images
    }
}

# Iris Recognition Configuration
IRIS_RECOGNITION_CONFIG = {
    'model': {
        'name': 'UniNet',
        'backbone': 'densenet201',
        'embedding_size': 256,
        'pretrained': True,
        'attention_type': 'cbam',
    },
    'training': {
        'epochs': 100,
        'batch_size': 32,
        'learning_rate': 1e-4,
        'weight_decay': 1e-5,
        'scheduler': 'cosine_warmup',
        'warmup_epochs': 5,
    },
    'preprocessing': {
        'normalization_size': (100, 360),  # Standard size for normalized iris
        'enhancement_method': 'clahe',
        'noise_removal': True,
    },
    'threshold': {
        'matching_threshold': 0.92,  # Very high threshold for iris matching
        'quality_threshold': 0.90,  # High quality requirement for iris images
    }
}

# Evaluation Configuration
EVALUATION_CONFIG = {
    'metrics': [
        'accuracy',
        'precision',
        'recall',
        'f1_score',
        'auc_roc',
        'far',  # False Acceptance Rate
        'frr',  # False Rejection Rate
        'eer',  # Equal Error Rate
    ],
    'validation_split': 0.2,
    'test_split': 0.1,
    'cross_validation_folds': 5,
}

# Ensemble Configuration
ENSEMBLE_CONFIG = {
    'face_weight': 0.4,  # Weight for face recognition score
    'iris_weight': 0.6,  # Weight for iris recognition score (higher weight due to uniqueness)
    'min_face_score': 0.85,  # Minimum required face recognition score
    'min_iris_score': 0.90,  # Minimum required iris recognition score
    'combined_threshold': 0.92,  # Minimum combined score for acceptance
}

# Security Configuration
SECURITY_CONFIG = {
    'max_attempts': 3,  # Maximum number of verification attempts
    'cooldown_period': 300,  # Cooldown period in seconds after max attempts
    'session_timeout': 600,  # Session timeout in seconds
    'log_level': 'INFO',
    'save_failed_attempts': True,  # Save failed verification attempts for analysis
}

# Monitoring Configuration
MONITORING_CONFIG = {
    'enable_wandb': True,  # Enable Weights & Biases logging
    'enable_tensorboard': True,
    'log_interval': 100,  # Log every N batches
    'save_interval': 5,  # Save checkpoint every N epochs
    'metrics_history': True,  # Keep history of all metrics
}

# Export all configurations
CONFIG = {
    'base': BASE_CONFIG,
    'paths': PATHS,
    'face_spoof': FACE_SPOOF_CONFIG,
    'face_recognition': FACE_RECOGNITION_CONFIG,
    'iris_detection': IRIS_DETECTION_CONFIG,
    'iris_recognition': IRIS_RECOGNITION_CONFIG,
    'evaluation': EVALUATION_CONFIG,
    'ensemble': ENSEMBLE_CONFIG,
    'security': SECURITY_CONFIG,
    'monitoring': MONITORING_CONFIG,
}
