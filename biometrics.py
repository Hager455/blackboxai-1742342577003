import requests
import logging
from PIL import Image
import numpy as np
from config import Config
import uuid

logger = logging.getLogger(__name__)

def preprocess_image(image_path):
    """
    Preprocess image for AI model input.
    """
    try:
        # Open and resize image
        img = Image.open(image_path)
        img = img.resize((224, 224))  # Standard input size for many AI models
        
        # Convert to numpy array and normalize
        img_array = np.array(img)
        img_array = img_array / 255.0  # Normalize pixel values
        
        return {
            'success': True,
            'image': img_array
        }
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def make_api_request(url, data):
    """
    Make request to AI model API endpoint.
    """
    try:
        response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def verify_face(image_path):
    """
    Verify if the face is real (not fake/spoofed).
    """
    try:
        # Preprocess image
        prep_result = preprocess_image(image_path)
        if not prep_result['success']:
            return prep_result

        # Prepare data for API request
        data = {
            'image': prep_result['image'].tolist()
        }

        # Make request to face authentication model
        result = make_api_request(Config.FACE_AUTH_URL, data)
        
        if result.get('success'):
            return {
                'success': True,
                'is_real': result.get('is_real', False),
                'confidence': result.get('confidence', 0)
            }
        else:
            return {
                'success': False,
                'error': result.get('error', 'Unknown error in face verification')
            }

    except Exception as e:
        logger.error(f"Error in face verification: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def recognize_face(image_path):
    """
    Perform face recognition to identify the voter.
    """
    try:
        # Preprocess image
        prep_result = preprocess_image(image_path)
        if not prep_result['success']:
            return prep_result

        # Prepare data for API request
        data = {
            'image': prep_result['image'].tolist()
        }

        # Make request to face recognition model
        result = make_api_request(Config.FACE_RECOGNITION_URL, data)
        
        if result.get('success'):
            return {
                'success': True,
                'verification_id': str(uuid.uuid4()),  # Generate unique verification ID
                'confidence': result.get('confidence', 0)
            }
        else:
            return {
                'success': False,
                'error': result.get('error', 'Unknown error in face recognition')
            }

    except Exception as e:
        logger.error(f"Error in face recognition: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def iris_detection(image_path):
    """
    Detect iris in the provided image.
    """
    try:
        # Preprocess image
        prep_result = preprocess_image(image_path)
        if not prep_result['success']:
            return prep_result

        # Prepare data for API request
        data = {
            'image': prep_result['image'].tolist()
        }

        # Make request to iris detection model
        result = make_api_request(Config.IRIS_DETECTION_URL, data)
        
        if result.get('success'):
            return {
                'success': True,
                'iris_detected': result.get('iris_detected', False),
                'confidence': result.get('confidence', 0)
            }
        else:
            return {
                'success': False,
                'error': result.get('error', 'Unknown error in iris detection')
            }

    except Exception as e:
        logger.error(f"Error in iris detection: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def iris_analysis(image_path):
    """
    Analyze iris patterns for verification.
    """
    try:
        # Preprocess image
        prep_result = preprocess_image(image_path)
        if not prep_result['success']:
            return prep_result

        # Prepare data for API request
        data = {
            'image': prep_result['image'].tolist()
        }

        # Make request to iris analysis model
        result = make_api_request(Config.IRIS_ANALYSIS_URL, data)
        
        if result.get('success'):
            return {
                'success': True,
                'iris_match': result.get('iris_match', False),
                'confidence': result.get('confidence', 0)
            }
        else:
            return {
                'success': False,
                'error': result.get('error', 'Unknown error in iris analysis')
            }

    except Exception as e:
        logger.error(f"Error in iris analysis: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
