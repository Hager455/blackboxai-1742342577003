import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Flask configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    
    # Blockchain configuration
    BLOCKCHAIN_URL = os.getenv('BLOCKCHAIN_URL', 'https://sepolia.infura.io/v3/YOUR-PROJECT-ID')
    CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS', '')
    
    # AI Model endpoints (Colab notebooks)
    FACE_AUTH_URL = os.getenv('FACE_AUTH_URL', '')
    FACE_RECOGNITION_URL = os.getenv('FACE_RECOGNITION_URL', '')
    IRIS_DETECTION_URL = os.getenv('IRIS_DETECTION_URL', '')
    IRIS_ANALYSIS_URL = os.getenv('IRIS_ANALYSIS_URL', '')
    
    # File upload configuration
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}
