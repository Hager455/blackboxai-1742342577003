import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models
from typing import Dict, Tuple, Optional
import math

class ArcMarginProduct(nn.Module):
    """
    Implement of large margin arc distance for face recognition
    Reference: https://arxiv.org/abs/1801.07698
    """
    def __init__(self, in_features: int, out_features: int, scale: float = 30.0, margin: float = 0.50):
        super(ArcMarginProduct, self).__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.scale = scale
        self.margin = margin
        self.weight = nn.Parameter(torch.FloatTensor(out_features, in_features))
        nn.init.xavier_uniform_(self.weight)

        self.cos_m = math.cos(margin)
        self.sin_m = math.sin(margin)
        self.th = math.cos(math.pi - margin)
        self.mm = math.sin(math.pi - margin) * margin

    def forward(self, input: torch.Tensor, label: Optional[torch.Tensor] = None) -> torch.Tensor:
        cosine = F.linear(F.normalize(input), F.normalize(self.weight))
        if label is None:
            return cosine
        
        sine = torch.sqrt(1.0 - torch.pow(cosine, 2))
        phi = cosine * self.cos_m - sine * self.sin_m
        phi = torch.where(cosine > self.th, phi, cosine - self.mm)
        
        one_hot = torch.zeros_like(cosine)
        one_hot.scatter_(1, label.view(-1, 1).long(), 1)
        output = (one_hot * phi) + ((1.0 - one_hot) * cosine)
        output *= self.scale
        
        return output

class AttentionModule(nn.Module):
    """Spatial and Channel Attention Module"""
    def __init__(self, channels: int):
        super(AttentionModule, self).__init__()
        self.spatial_attention = nn.Sequential(
            nn.Conv2d(channels, 1, kernel_size=7, padding=3),
            nn.BatchNorm2d(1),
            nn.Sigmoid()
        )
        self.channel_attention = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(channels, channels // 16, kernel_size=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels // 16, channels, kernel_size=1),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        spatial_attention = self.spatial_attention(x)
        channel_attention = self.channel_attention(x)
        attention = spatial_attention * channel_attention
        return x * attention

class FaceRecognitionModel(nn.Module):
    """
    Face Recognition Model using ArcFace with ResNet152 backbone
    """
    def __init__(self, config: Dict):
        super(FaceRecognitionModel, self).__init__()
        
        # Load configuration
        self.embedding_size = config['face_recognition']['model']['embedding_size']
        self.pretrained = config['face_recognition']['model']['pretrained']
        
        # Load backbone
        backbone = models.resnet152(pretrained=self.pretrained)
        self.features = nn.Sequential(*list(backbone.children())[:-2])
        
        # Attention modules
        self.attention1 = AttentionModule(512)
        self.attention2 = AttentionModule(1024)
        self.attention3 = AttentionModule(2048)
        
        # Feature processing
        self.gap = nn.AdaptiveAvgPool2d(1)
        self.gmp = nn.AdaptiveMaxPool2d(1)
        
        # Embedding layers
        self.embedding = nn.Sequential(
            nn.Linear(2048 * 2, 1024),
            nn.BatchNorm1d(1024),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(1024, self.embedding_size),
            nn.BatchNorm1d(self.embedding_size)
        )
        
        # Arc margin product
        self.arc_margin = ArcMarginProduct(
            in_features=self.embedding_size,
            out_features=config['face_recognition']['model']['num_classes'],
            scale=config['face_recognition']['model']['scale'],
            margin=config['face_recognition']['model']['margin']
        )

    def forward(self, x: torch.Tensor, label: Optional[torch.Tensor] = None) -> Dict:
        # Feature extraction with attention
        features = []
        for i, layer in enumerate(self.features):
            x = layer(x)
            if i == 5:  # After layer2
                x = self.attention1(x)
                features.append(x)
            elif i == 6:  # After layer3
                x = self.attention2(x)
                features.append(x)
            elif i == 7:  # After layer4
                x = self.attention3(x)
                features.append(x)
        
        # Global pooling
        avg_pool = self.gap(x).view(x.size(0), -1)
        max_pool = self.gmp(x).view(x.size(0), -1)
        
        # Concatenate pooling results
        x = torch.cat([avg_pool, max_pool], dim=1)
        
        # Get embedding
        embedding = self.embedding(x)
        
        # Normalize embedding
        normalized_embedding = F.normalize(embedding, p=2, dim=1)
        
        # Get output through arc margin if label is provided
        if label is not None:
            output = self.arc_margin(normalized_embedding, label)
        else:
            output = self.arc_margin(normalized_embedding)
        
        return {
            'embedding': normalized_embedding,
            'output': output,
            'features': features
        }

class FaceRecognizer:
    def __init__(self, config: Dict):
        self.config = config
        self.device = torch.device(config['base']['device'])
        self.model = FaceRecognitionModel(config).to(self.device)
        self.similarity_threshold = config['face_recognition']['threshold']['similarity_threshold']

    def preprocess_image(self, image: torch.Tensor) -> torch.Tensor:
        """Preprocess image for model input"""
        if len(image.shape) == 3:
            image = image.unsqueeze(0)
        return image.to(self.device)

    def extract_features(self, image: torch.Tensor) -> torch.Tensor:
        """Extract face embedding features"""
        self.model.eval()
        with torch.no_grad():
            image = self.preprocess_image(image)
            output = self.model(image)
            return output['embedding']

    def compare_faces(self, face1: torch.Tensor, face2: torch.Tensor) -> Dict:
        """Compare two face embeddings"""
        embedding1 = self.extract_features(face1)
        embedding2 = self.extract_features(face2)
        
        # Calculate cosine similarity
        similarity = F.cosine_similarity(embedding1, embedding2).item()
        
        return {
            'similarity': similarity,
            'match': similarity > self.similarity_threshold,
            'confidence': similarity
        }

    def train_step(self, images: torch.Tensor, labels: torch.Tensor) -> Dict:
        """Single training step"""
        self.model.train()
        
        # Forward pass
        output = self.model(images, labels)
        
        # Calculate loss
        loss = F.cross_entropy(output['output'], labels)
        
        # Calculate accuracy
        predictions = torch.argmax(output['output'], dim=1)
        accuracy = (predictions == labels).float().mean()
        
        return {
            'loss': loss,
            'accuracy': accuracy.item(),
            'embeddings': output['embedding'].detach(),
            'predictions': predictions.detach()
        }

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

    def get_embedding_distance(self, embedding1: torch.Tensor, embedding2: torch.Tensor) -> float:
        """Calculate L2 distance between embeddings"""
        return torch.norm(embedding1 - embedding2, p=2).item()

    def verify_identity(self, probe_image: torch.Tensor, gallery_embeddings: Dict[str, torch.Tensor]) -> Dict:
        """Verify identity against a gallery of known embeddings"""
        probe_embedding = self.extract_features(probe_image)
        
        results = {}
        for identity, gallery_embedding in gallery_embeddings.items():
            similarity = F.cosine_similarity(probe_embedding, gallery_embedding).item()
            results[identity] = {
                'similarity': similarity,
                'match': similarity > self.similarity_threshold
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
