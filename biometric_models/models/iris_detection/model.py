import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple, List
import timm
from torchvision import transforms

class ConvBlock(nn.Module):
    """Basic convolutional block with batch normalization and ReLU activation"""
    def __init__(self, in_channels: int, out_channels: int):
        super(ConvBlock, self).__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.conv(x)

class AttentionGate(nn.Module):
    """Attention Gate for focusing on relevant features"""
    def __init__(self, F_g: int, F_l: int, F_int: int):
        super(AttentionGate, self).__init__()
        self.W_g = nn.Sequential(
            nn.Conv2d(F_g, F_int, kernel_size=1),
            nn.BatchNorm2d(F_int)
        )
        self.W_x = nn.Sequential(
            nn.Conv2d(F_l, F_int, kernel_size=1),
            nn.BatchNorm2d(F_int)
        )
        self.psi = nn.Sequential(
            nn.Conv2d(F_int, 1, kernel_size=1),
            nn.BatchNorm2d(1),
            nn.Sigmoid()
        )
        self.relu = nn.ReLU(inplace=True)

    def forward(self, g: torch.Tensor, x: torch.Tensor) -> torch.Tensor:
        g1 = self.W_g(g)
        x1 = self.W_x(x)
        psi = self.relu(g1 + x1)
        psi = self.psi(psi)
        return x * psi

class UNetPlusPlus(nn.Module):
    """
    UNet++ architecture with EfficientNet backbone for iris detection
    Reference: https://arxiv.org/abs/1807.10165
    """
    def __init__(self, config: Dict):
        super(UNetPlusPlus, self).__init__()
        
        # Load configuration
        self.input_size = config['iris_detection']['model']['input_size']
        
        # Load encoder backbone
        self.encoder = timm.create_model(
            config['iris_detection']['model']['encoder'],
            pretrained=config['iris_detection']['model']['pretrained'],
            features_only=True
        )
        
        # Get encoder channels
        encoder_channels = self.encoder.feature_info.channels()
        
        # Decoder blocks
        self.decoder_blocks = nn.ModuleList([
            ConvBlock(encoder_channels[-1], 512),
            ConvBlock(512 + encoder_channels[-2], 256),
            ConvBlock(256 + encoder_channels[-3], 128),
            ConvBlock(128 + encoder_channels[-4], 64),
            ConvBlock(64 + encoder_channels[-5], 32)
        ])
        
        # Attention gates
        self.attention_gates = nn.ModuleList([
            AttentionGate(512, encoder_channels[-2], 256),
            AttentionGate(256, encoder_channels[-3], 128),
            AttentionGate(128, encoder_channels[-4], 64),
            AttentionGate(64, encoder_channels[-5], 32)
        ])
        
        # Deep supervision outputs
        self.deep_supervision = nn.ModuleList([
            nn.Conv2d(512, 1, kernel_size=1),
            nn.Conv2d(256, 1, kernel_size=1),
            nn.Conv2d(128, 1, kernel_size=1),
            nn.Conv2d(64, 1, kernel_size=1)
        ])
        
        # Final output
        self.final_conv = nn.Conv2d(32, 1, kernel_size=1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        # Encoder features
        encoder_features = self.encoder(x)
        
        # Initialize outputs dictionary
        outputs = {}
        
        # Decoder with deep supervision
        x = encoder_features[-1]
        deep_outputs = []
        
        for i, (decoder_block, attention_gate) in enumerate(zip(
            self.decoder_blocks[:-1], self.attention_gates
        )):
            # Apply attention
            skip_connection = attention_gate(x, encoder_features[-(i+2)])
            
            # Concatenate and decode
            x = torch.cat([x, skip_connection], dim=1)
            x = decoder_block(x)
            
            # Deep supervision output
            deep_output = self.deep_supervision[i](x)
            deep_outputs.append(deep_output)
            
            # Upsample for next iteration
            x = F.interpolate(x, scale_factor=2, mode='bilinear', align_corners=True)
        
        # Final decoder block
        x = torch.cat([x, encoder_features[0]], dim=1)
        x = self.decoder_blocks[-1](x)
        
        # Final output
        final_output = self.sigmoid(self.final_conv(x))
        
        # Collect all outputs
        outputs['final_output'] = final_output
        outputs['deep_outputs'] = deep_outputs
        
        return outputs

class IrisDetector:
    def __init__(self, config: Dict):
        self.config = config
        self.device = torch.device(config['base']['device'])
        self.model = UNetPlusPlus(config).to(self.device)
        self.detection_threshold = config['iris_detection']['threshold']['detection_confidence']
        self.quality_threshold = config['iris_detection']['threshold']['quality_threshold']
        
        # Initialize transforms
        self.transforms = transforms.Compose([
            transforms.Resize(config['iris_detection']['model']['input_size']),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def preprocess_image(self, image: torch.Tensor) -> torch.Tensor:
        """Preprocess image for model input"""
        if len(image.shape) == 3:
            image = image.unsqueeze(0)
        image = self.transforms(image)
        return image.to(self.device)

    def detect_iris(self, image: torch.Tensor) -> Dict:
        """Detect iris in image"""
        self.model.eval()
        with torch.no_grad():
            image = self.preprocess_image(image)
            outputs = self.model(image)
            
            # Get final segmentation mask
            mask = outputs['final_output']
            
            # Calculate confidence and quality scores
            confidence = torch.mean(mask).item()
            quality_score = self._calculate_quality_score(mask)
            
            # Get iris bounding box
            bbox = self._get_iris_bbox(mask)
            
            result = {
                'detected': confidence > self.detection_threshold,
                'confidence': confidence,
                'quality_score': quality_score,
                'mask': mask.cpu(),
                'bbox': bbox,
                'is_valid': quality_score > self.quality_threshold
            }
            
            return result

    def _calculate_quality_score(self, mask: torch.Tensor) -> float:
        """Calculate iris image quality score"""
        # Implement quality metrics (contrast, focus, occlusion)
        contrast = torch.std(mask).item()
        coverage = torch.mean((mask > 0.5).float()).item()
        smoothness = 1 - torch.mean(torch.abs(mask[:, :, 1:] - mask[:, :, :-1])).item()
        
        quality_score = (contrast + coverage + smoothness) / 3
        return quality_score

    def _get_iris_bbox(self, mask: torch.Tensor) -> List[int]:
        """Get iris bounding box from segmentation mask"""
        binary_mask = (mask > 0.5).float()
        rows = torch.any(binary_mask, dim=2)
        cols = torch.any(binary_mask, dim=1)
        
        ymin, ymax = torch.where(rows)[0][[0, -1]]
        xmin, xmax = torch.where(cols)[0][[0, -1]]
        
        return [xmin.item(), ymin.item(), xmax.item(), ymax.item()]

    def train_step(self, images: torch.Tensor, masks: torch.Tensor) -> Dict:
        """Single training step"""
        self.model.train()
        
        # Forward pass
        outputs = self.model(images)
        
        # Calculate losses
        final_loss = F.binary_cross_entropy(outputs['final_output'], masks)
        
        # Deep supervision losses
        deep_losses = []
        for deep_output in outputs['deep_outputs']:
            # Resize mask to match deep supervision output
            resized_mask = F.interpolate(
                masks,
                size=deep_output.shape[2:],
                mode='bilinear',
                align_corners=True
            )
            deep_losses.append(F.binary_cross_entropy(deep_output, resized_mask))
        
        # Combine losses
        deep_loss = sum(deep_losses) / len(deep_losses)
        total_loss = final_loss + 0.5 * deep_loss
        
        # Calculate metrics
        dice_score = self._calculate_dice_score(outputs['final_output'], masks)
        
        return {
            'loss': total_loss,
            'final_loss': final_loss.item(),
            'deep_loss': deep_loss.item(),
            'dice_score': dice_score,
            'predictions': outputs['final_output'].detach()
        }

    def _calculate_dice_score(self, pred: torch.Tensor, target: torch.Tensor, smooth: float = 1e-7) -> float:
        """Calculate Dice score for segmentation evaluation"""
        pred = (pred > 0.5).float()
        intersection = torch.sum(pred * target)
        return (2. * intersection + smooth) / (torch.sum(pred) + torch.sum(target) + smooth)

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
