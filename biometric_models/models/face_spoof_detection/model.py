import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models
from typing import Dict, Tuple

class CDCNBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int):
        super(CDCNBlock, self).__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=1, padding=1)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=1, padding=1)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.relu(self.bn1(self.conv1(x)))
        x = self.relu(self.bn2(self.conv2(x)))
        x = self.pool(x)
        return x

class CDCN(nn.Module):
    """
    CDCN++ (Central Difference Convolutional Network) for Face Anti-Spoofing
    Reference: https://arxiv.org/abs/2003.04092
    """
    def __init__(self, config: Dict):
        super(CDCN, self).__init__()
        
        # Load configuration
        self.input_size = config['model']['input_size']
        self.num_classes = config['model']['num_classes']
        
        # Feature extraction backbone
        backbone = models.resnet50(pretrained=config['model']['pretrained'])
        self.features = nn.Sequential(*list(backbone.children())[:-2])
        
        # CDC blocks for multi-level feature extraction
        self.cdc_blocks = nn.ModuleList([
            CDCNBlock(3, 64),
            CDCNBlock(64, 128),
            CDCNBlock(128, 256),
            CDCNBlock(256, 512)
        ])
        
        # Attention mechanism
        self.attention = nn.Sequential(
            nn.Conv2d(512, 512, kernel_size=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),
            nn.Conv2d(512, 1, kernel_size=1),
            nn.Sigmoid()
        )
        
        # Depth map estimation
        self.depth_estimation = nn.Sequential(
            nn.Conv2d(512, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 1, kernel_size=1),
            nn.Sigmoid()
        )
        
        # Binary classification head
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(256, self.num_classes),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        # Multi-scale feature extraction
        features = []
        for block in self.cdc_blocks:
            x = block(x)
            features.append(x)
        
        # Feature fusion
        x = features[-1]
        
        # Attention mechanism
        attention_map = self.attention(x)
        x = x * attention_map
        
        # Depth map estimation
        depth_map = self.depth_estimation(x)
        
        # Classification
        classification = self.classifier(x)
        
        return classification, depth_map, attention_map

class FaceSpoofDetector:
    def __init__(self, config: Dict):
        self.config = config
        self.device = torch.device(config['base']['device'])
        self.model = CDCN(config).to(self.device)
        self.threshold = config['face_spoof']['threshold']['spoof_confidence']

    def preprocess_image(self, image: torch.Tensor) -> torch.Tensor:
        """Preprocess image for model input"""
        if len(image.shape) == 3:
            image = image.unsqueeze(0)
        
        # Ensure correct size
        if image.shape[-2:] != self.config['face_spoof']['model']['input_size']:
            image = F.interpolate(
                image,
                size=self.config['face_spoof']['model']['input_size'],
                mode='bilinear',
                align_corners=False
            )
        
        return image.to(self.device)

    def detect_spoof(self, image: torch.Tensor) -> Dict:
        """
        Detect if an image is real or spoof
        Returns: Dict containing classification score, depth map, and attention map
        """
        self.model.eval()
        with torch.no_grad():
            image = self.preprocess_image(image)
            classification, depth_map, attention_map = self.model(image)
            
            # Get prediction
            is_real = classification.item() > self.threshold
            confidence = classification.item()
            
            result = {
                'is_real': is_real,
                'confidence': confidence,
                'depth_map': depth_map.cpu(),
                'attention_map': attention_map.cpu()
            }
            
            return result

    def train_step(self, images: torch.Tensor, labels: torch.Tensor, depth_maps: torch.Tensor) -> Dict:
        """Single training step"""
        self.model.train()
        
        # Forward pass
        classification, pred_depth, attention = self.model(images)
        
        # Calculate losses
        classification_loss = F.binary_cross_entropy(classification, labels)
        depth_loss = F.mse_loss(pred_depth, depth_maps)
        
        # Total loss (weighted sum)
        total_loss = classification_loss + 0.5 * depth_loss
        
        return {
            'total_loss': total_loss,
            'classification_loss': classification_loss.item(),
            'depth_loss': depth_loss.item(),
            'predictions': classification.detach(),
            'depth_maps': pred_depth.detach(),
            'attention_maps': attention.detach()
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

    @staticmethod
    def get_model_size(model: nn.Module) -> int:
        """Get model size in parameters"""
        return sum(p.numel() for p in model.parameters() if p.requires_grad)

    def get_inference_time(self, image: torch.Tensor) -> float:
        """Get model inference time"""
        import time
        
        self.model.eval()
        with torch.no_grad():
            image = self.preprocess_image(image)
            
            start_time = time.time()
            _ = self.model(image)
            end_time = time.time()
            
            return end_time - start_time
