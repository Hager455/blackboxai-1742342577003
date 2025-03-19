import torch
import logging
from typing import Dict, Optional, Tuple
from pathlib import Path
import time

from models.face_spoof_detection.model import FaceSpoofDetector
from models.face_recognition.model import FaceRecognizer
from models.iris_detection.model import IrisDetector
from models.iris_recognition.model import IrisRecognizer
from config import CONFIG

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BiometricVerifier:
    def __init__(self, config: Dict = CONFIG):
        self.config = config
        self.device = torch.device(config['base']['device'])
        
        # Initialize models
        logger.info("Initializing biometric verification models...")
        self.face_spoof_detector = FaceSpoofDetector(config)
        self.face_recognizer = FaceRecognizer(config)
        self.iris_detector = IrisDetector(config)
        self.iris_recognizer = IrisRecognizer(config)
        
        # Load models
        self._load_models()
        
        logger.info("Biometric verification system initialized successfully")

    def _load_models(self):
        """Load all model weights"""
        models_dir = Path(self.config['paths']['models_dir'])
        
        try:
            self.face_spoof_detector.load_model(models_dir / 'face_spoof.pth')
            self.face_recognizer.load_model(models_dir / 'face_recognition.pth')
            self.iris_detector.load_model(models_dir / 'iris_detection.pth')
            self.iris_recognizer.load_model(models_dir / 'iris_recognition.pth')
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            raise

    def verify_identity(
        self,
        face_image: torch.Tensor,
        iris_image: torch.Tensor,
        reference_embeddings: Dict[str, Dict[str, torch.Tensor]]
    ) -> Dict:
        """
        Complete biometric verification process
        Args:
            face_image: Input face image tensor
            iris_image: Input iris image tensor
            reference_embeddings: Dictionary containing reference embeddings
                {
                    'user_id': {
                        'face_embedding': tensor,
                        'iris_embedding': tensor
                    }
                }
        """
        verification_start = time.time()
        results = {
            'success': False,
            'steps': {},
            'timing': {}
        }

        try:
            # Step 1: Face Spoof Detection
            step_start = time.time()
            spoof_result = self.face_spoof_detector.detect_spoof(face_image)
            results['steps']['face_spoof'] = spoof_result
            results['timing']['face_spoof'] = time.time() - step_start

            if not spoof_result['is_real']:
                results['error'] = 'Fake face detected'
                return results

            # Step 2: Face Recognition
            step_start = time.time()
            face_embedding = self.face_recognizer.extract_features(face_image)
            face_verification = self._verify_face_embedding(face_embedding, reference_embeddings)
            results['steps']['face_recognition'] = face_verification
            results['timing']['face_recognition'] = time.time() - step_start

            if not face_verification['match']:
                results['error'] = 'Face verification failed'
                return results

            # Step 3: Iris Detection
            step_start = time.time()
            iris_detection = self.iris_detector.detect_iris(iris_image)
            results['steps']['iris_detection'] = iris_detection
            results['timing']['iris_detection'] = time.time() - step_start

            if not iris_detection['detected'] or not iris_detection['is_valid']:
                results['error'] = 'Invalid iris image'
                return results

            # Step 4: Iris Recognition
            step_start = time.time()
            iris_embedding = self.iris_recognizer.extract_features(iris_image)
            iris_verification = self._verify_iris_embedding(iris_embedding, reference_embeddings)
            results['steps']['iris_recognition'] = iris_verification
            results['timing']['iris_recognition'] = time.time() - step_start

            if not iris_verification['match']:
                results['error'] = 'Iris verification failed'
                return results

            # Calculate final verification score
            final_score = self._calculate_combined_score(
                face_verification['similarity'],
                iris_verification['similarity']
            )

            results.update({
                'success': True,
                'final_score': final_score,
                'verified_identity': face_verification['identity'],
                'total_time': time.time() - verification_start
            })

        except Exception as e:
            logger.error(f"Verification error: {str(e)}")
            results.update({
                'success': False,
                'error': str(e)
            })

        return results

    def _verify_face_embedding(
        self,
        probe_embedding: torch.Tensor,
        reference_embeddings: Dict[str, Dict[str, torch.Tensor]]
    ) -> Dict:
        """Verify face embedding against reference embeddings"""
        best_match = {
            'identity': None,
            'similarity': 0,
            'match': False
        }

        for identity, embeddings in reference_embeddings.items():
            similarity = F.cosine_similarity(
                probe_embedding,
                embeddings['face_embedding'].to(self.device)
            ).item()

            if similarity > best_match['similarity']:
                best_match.update({
                    'identity': identity,
                    'similarity': similarity,
                    'match': similarity > self.config['face_recognition']['threshold']['similarity_threshold']
                })

        return best_match

    def _verify_iris_embedding(
        self,
        probe_embedding: torch.Tensor,
        reference_embeddings: Dict[str, Dict[str, torch.Tensor]]
    ) -> Dict:
        """Verify iris embedding against reference embeddings"""
        best_match = {
            'identity': None,
            'similarity': 0,
            'match': False
        }

        for identity, embeddings in reference_embeddings.items():
            similarity = F.cosine_similarity(
                probe_embedding,
                embeddings['iris_embedding'].to(self.device)
            ).item()

            if similarity > best_match['similarity']:
                best_match.update({
                    'identity': identity,
                    'similarity': similarity,
                    'match': similarity > self.config['iris_recognition']['threshold']['matching_threshold']
                })

        return best_match

    def _calculate_combined_score(self, face_score: float, iris_score: float) -> float:
        """Calculate combined verification score"""
        weights = self.config['ensemble']
        combined_score = (
            weights['face_weight'] * face_score +
            weights['iris_weight'] * iris_score
        )
        return combined_score

    def update_reference_embeddings(
        self,
        user_id: str,
        face_image: Optional[torch.Tensor] = None,
        iris_image: Optional[torch.Tensor] = None
    ) -> Dict:
        """Update reference embeddings for a user"""
        result = {
            'success': False,
            'updated': []
        }

        try:
            if face_image is not None:
                # Verify real face first
                spoof_check = self.face_spoof_detector.detect_spoof(face_image)
                if not spoof_check['is_real']:
                    raise ValueError("Fake face detected during enrollment")

                # Extract face embedding
                face_embedding = self.face_recognizer.extract_features(face_image)
                result['updated'].append('face')

            if iris_image is not None:
                # Verify iris quality first
                iris_check = self.iris_detector.detect_iris(iris_image)
                if not iris_check['is_valid']:
                    raise ValueError("Invalid iris image during enrollment")

                # Extract iris embedding
                iris_embedding = self.iris_recognizer.extract_features(iris_image)
                result['updated'].append('iris')

            result['success'] = True

        except Exception as e:
            logger.error(f"Enrollment error for user {user_id}: {str(e)}")
            result['error'] = str(e)

        return result

    def verify_liveness(self, face_image: torch.Tensor) -> Dict:
        """Dedicated liveness detection check"""
        try:
            spoof_result = self.face_spoof_detector.detect_spoof(face_image)
            
            return {
                'success': True,
                'is_live': spoof_result['is_real'],
                'confidence': spoof_result['confidence'],
                'attention_map': spoof_result['attention_map']
            }
        except Exception as e:
            logger.error(f"Liveness check error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def verify_iris_quality(self, iris_image: torch.Tensor) -> Dict:
        """Dedicated iris quality check"""
        try:
            quality_result = self.iris_detector.detect_iris(iris_image)
            
            return {
                'success': True,
                'is_valid': quality_result['is_valid'],
                'quality_score': quality_result['quality_score'],
                'bbox': quality_result['bbox']
            }
        except Exception as e:
            logger.error(f"Iris quality check error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

if __name__ == "__main__":
    # Example usage
    verifier = BiometricVerifier()
    
    # Load test images
    face_image = torch.randn(1, 3, 256, 256)  # Replace with actual image loading
    iris_image = torch.randn(1, 3, 320, 320)  # Replace with actual image loading
    
    # Example reference embeddings
    reference_embeddings = {
        'user_1': {
            'face_embedding': torch.randn(512),  # Replace with actual embeddings
            'iris_embedding': torch.randn(256)
        }
    }
    
    # Perform verification
    result = verifier.verify_identity(face_image, iris_image, reference_embeddings)
    print(result)
