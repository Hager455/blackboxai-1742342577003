import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple, Optional
import timm
from torchvision import transforms

class CBAM(nn.Module):
    """
    Convolutional Block Attention Module
    Reference: https://arxiv.org/abs/1807.06521
    """
    def __init__(self, channels: int, reduction: int = 16):
        super(CBAM, self).__init__()
        
        # Channel attention
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(channels, channels // reduction),
            nn.ReLU(inplace=True),
            nn.Linear(channels // reduction, channels)
        )
        
        # Spatial attention
        self.conv = nn.Sequential(
            nn.Conv2d(2, 1, kernel_size=7, padding=3),
            nn.BatchNorm2d(1),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Channel attention
        avg_pool = self.avg_pool(x).view(x.size(0), -1)
        max_pool = self.max_pool(x).view(x.size(0), -1)
        
        avg_out = self.fc(avg_pool).unsqueeze(2).unsqueeze(3)
        max_out = self.fc(max_pool).unsqueeze(2).unsqueeze(3)
        
        channel_out = torch.sigmoid(avg_out + max_out)
        x = x * channel_out
        
        # Spatial attention
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        spatial_out = torch.cat([avg_out, max_out], dim=1)
        spatial_out = self.conv(spatial_out)
        
        return x * spatial_out

class IrisEncoder(nn.Module):
    """
    Iris Recognition Model using DenseNet backbone with CBAM attention
    """
    def __init__(self, config: Dict):
        super(IrisEncoder, self).__init__()
        
        # Load configuration
        self.embedding_size = config['iris_recognition']['model']['embedding_size']
        
        # Load backbone
        self.backbone = timm.create_model(
            config['iris_recognition']['model']['backbone'],
            pretrained=config['iris_recognition']['model']['pretrained'],
            features_only=True
        )
        
        # Get backbone channels
        backbone_channels = self.backbone.feature_info.channels()
        
        # Attention modules
        self.attention_modules = nn.ModuleList([
            CBAM(channels) for channels in backbone_channels
        ])
        
        # Feature fusion
        self.fusion = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(sum(backbone_channels), 1024),
            nn.BatchNorm1d(1024),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(1024, self.embedding_size),
            nn.BatchNorm1d(self.embedding_size)
        )

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        # Get backbone features
        features = self.backbone(x)
        
        # Apply attention to each feature level
        attended_features = []
        for feature, attention in zip(features, self.attention_modules):
            attended_feature = attention(feature)
            attended_features.append(attended_feature)
        
        # Global pooling and concatenation
        pooled_features = []
        for feature in attended_features:
            pooled = F.adaptive_avg_pool2d(feature, 1).flatten(1)
            pooled_features.append(pooled)
        
        # Concatenate all features
        concat_features = torch.cat(pooled_features, dim=1)
        
        # Get embedding
        embedding = self.fusion(concat_features)
        
        # Normalize embedding
        normalized_embedding = F.normalize(embedding, p=2, dim=1)
        
        return {
            'embedding': normalized_embedding,
            'features': attended_features
        }

class IrisRecognizer:
    def __init__(self, config: Dict):
        self.config = config
        self.device = torch.device(config['base']['device'])
        self.model = IrisEncoder(config).to(self.device)
        self.matching_threshold = config['iris_recognition']['threshold']['matching_threshold']
        self.quality_threshold = config['iris_recognition']['threshold']['quality_threshold']
        
        # Initialize transforms
        self.transforms = transforms.Compose([
            transforms.Resize(config['iris_recognition']['preprocessing']['normalization_size']),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def preprocess_image(self, image: torch.Tensor) -> torch.Tensor:
        """Preprocess iris image"""
        if len(image.shape) == 3:
            image = image.unsqueeze(0)
        image = self.transforms(image)
        return image.to(self.device)

    def enhance_iris(self, image: torch.Tensor) -> torch.Tensor:
        """Enhance iris image quality"""
        # Apply CLAHE
        if self.config['iris_recognition']['preprocessing']['enhancement_method'] == 'clahe':
            image = self._apply_clahe(image)
        
        # Remove noise if configured
        if self.config['iris_recognition']['preprocessing']['noise_removal']:
            image = self._remove_noise(image)
        
        return image

    def _apply_clahe(self, image: torch.Tensor) -> torch.Tensor:
        """Apply Contrast Limited Adaptive Histogram Equalization"""
        import kornia as K
        return K.enhance.equalize_clahe(image)

    def _remove_noise(self, image: torch.Tensor) -> torch.Tensor:
        """Remove noise using median filtering"""
        import kornia as K
        return K.filters.median_blur(image, (3, 3))

    def extract_features(self, image: torch.Tensor) -> torch.Tensor:
        """Extract iris features"""
        self.model.eval()
        with torch.no_grad():
            image = self.preprocess_image(image)
            image = self.enhance_iris(image)
            output = self.model(image)
            return output['embedding']

    def compare_iris(self, iris1: torch.Tensor, iris2: torch.Tensor) -> Dict:
        """Compare two iris images"""
        embedding1 = self.extract_features(iris1)
        embedding2 = self.extract_features(iris2)
        
        # Calculate cosine similarity
        similarity = F.cosine_similarity(embedding1, embedding2).item()
        
        return {
            'similarity': similarity,
            'match': similarity > self.matching_threshold,
            'confidence': similarity
        }

    def verify_identity(self, probe_iris: torch.Tensor, gallery_embeddings: Dict[str, torch.Tensor]) -> Dict:
        """Verify identity against a gallery of known iris embeddings"""
        probe_embedding = self.extract_features(probe_iris)
        
        results = {}
        for identity, gallery_embedding in gallery_embeddings.items():
            similarity = F.cosine_similarity(probe_embedding, gallery_embedding).item()
            results[identity] = {
                'similarity': similarity,
                'match': similarity > self.matching_threshold
            }
        
        # Get best match
        best_match = max(results.items(), key=lambda x: x[1]['similarity'])
        
        return {
            'matches': results,
            'best_match': {
                'identity': best_match[0],
                'similarity': best_match[1]['similarity'],
                'is_match': best_match[1]['match']
            }
        }

    def train_step(self, images: torch.Tensor, labels: torch.Tensor) -> Dict:
        """Single training step with triplet loss"""
        self.model.train()
        
        # Get embeddings
        outputs = self.model(images)
        embeddings = outputs['embedding']
        
        # Calculate triplet loss
        triplet_loss = self._batch_hard_triplet_loss(embeddings, labels)
        
        return {
            'loss': triplet_loss,
            'embeddings': embeddings.detach()
        }

    def _batch_hard_triplet_loss(
        self, embeddings: torch.Tensor, labels: torch.Tensor, margin: float = 0.3
    ) -> torch.Tensor:
        """Compute batch hard triplet loss"""
        pairwise_dist = torch.cdist(embeddings, embeddings, p=2)
        
        # Get hardest positive and negative pairs
        mask_positive = labels.unsqueeze(0) == labels.unsqueeze(1)
        mask_negative = ~mask_positive
        mask_positive = mask_positive.float()
        mask_negative = mask_negative.float()
        
        hardest_positive_dist = (pairwise_dist * mask_positive).max(dim=1)[0]
        hardest_negative_dist = (pairwise_dist * mask_negative + 1e5 * mask_positive).min(dim=1)[0]
        
        loss = F.relu(hardest_positive_dist - hardest_negative_dist + margin)
        return loss.mean()

    def save_model(self, path: str):
        """Save model state"""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'config': self.config
        }, path)

    def load_model(self, path: str):
        """Load model state"""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.config = checkpoint['config']
        self.model.eval()
