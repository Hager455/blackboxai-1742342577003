import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import wandb
from pathlib import Path
import logging
from typing import Dict, List
import time
from tqdm import tqdm

from models.face_spoof_detection.model import FaceSpoofDetector
from models.face_recognition.model import FaceRecognizer
from models.iris_detection.model import IrisDetector
from models.iris_recognition.model import IrisRecognizer
from config import CONFIG

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelTrainer:
    def __init__(self, config: Dict = CONFIG):
        self.config = config
        self.device = torch.device(config['base']['device'])
        
        # Initialize models
        self.models = {
            'face_spoof': FaceSpoofDetector(config),
            'face_recognition': FaceRecognizer(config),
            'iris_detection': IrisDetector(config),
            'iris_recognition': IrisRecognizer(config)
        }
        
        # Initialize optimizers
        self.optimizers = self._initialize_optimizers()
        
        # Initialize schedulers
        self.schedulers = self._initialize_schedulers()
        
        # Setup logging
        self._setup_logging()

    def _initialize_optimizers(self) -> Dict:
        """Initialize optimizers for all models"""
        optimizers = {}
        for name, model in self.models.items():
            model_config = self.config[name]
            optimizers[name] = torch.optim.Adam(
                model.parameters(),
                lr=model_config['training']['learning_rate'],
                weight_decay=model_config['training']['weight_decay']
            )
        return optimizers

    def _initialize_schedulers(self) -> Dict:
        """Initialize learning rate schedulers"""
        schedulers = {}
        for name, optimizer in self.optimizers.items():
            model_config = self.config[name]['training']
            
            if model_config['scheduler'] == 'cosine':
                schedulers[name] = torch.optim.lr_scheduler.CosineAnnealingLR(
                    optimizer,
                    T_max=model_config['epochs']
                )
            elif model_config['scheduler'] == 'step':
                schedulers[name] = torch.optim.lr_scheduler.StepLR(
                    optimizer,
                    step_size=model_config['step_size'],
                    gamma=model_config['gamma']
                )
            elif model_config['scheduler'] == 'reduce_on_plateau':
                schedulers[name] = torch.optim.lr_scheduler.ReduceLROnPlateau(
                    optimizer,
                    mode='min',
                    patience=model_config['patience']
                )
        return schedulers

    def _setup_logging(self):
        """Setup wandb logging if enabled"""
        if self.config['monitoring']['enable_wandb']:
            wandb.init(
                project="biometric-verification",
                config=self.config
            )

    def train_face_spoof(self, train_loader: DataLoader, val_loader: DataLoader) -> Dict:
        """Train face spoof detection model"""
        logger.info("Training Face Spoof Detection model...")
        model = self.models['face_spoof']
        optimizer = self.optimizers['face_spoof']
        scheduler = self.schedulers['face_spoof']
        config = self.config['face_spoof']['training']
        
        best_metrics = {'val_loss': float('inf')}
        
        for epoch in range(config['epochs']):
            # Training phase
            model.train()
            train_metrics = self._train_epoch(
                'face_spoof',
                train_loader,
                optimizer
            )
            
            # Validation phase
            val_metrics = self._validate(
                'face_spoof',
                val_loader
            )
            
            # Update scheduler
            if isinstance(scheduler, torch.optim.lr_scheduler.ReduceLROnPlateau):
                scheduler.step(val_metrics['loss'])
            else:
                scheduler.step()
            
            # Log metrics
            self._log_metrics('face_spoof', epoch, train_metrics, val_metrics)
            
            # Save best model
            if val_metrics['loss'] < best_metrics['val_loss']:
                best_metrics = val_metrics
                self._save_model('face_spoof')
        
        return best_metrics

    def train_face_recognition(self, train_loader: DataLoader, val_loader: DataLoader) -> Dict:
        """Train face recognition model"""
        logger.info("Training Face Recognition model...")
        model = self.models['face_recognition']
        optimizer = self.optimizers['face_recognition']
        scheduler = self.schedulers['face_recognition']
        config = self.config['face_recognition']['training']
        
        best_metrics = {'val_accuracy': 0.0}
        
        for epoch in range(config['epochs']):
            # Training phase
            model.train()
            train_metrics = self._train_epoch(
                'face_recognition',
                train_loader,
                optimizer
            )
            
            # Validation phase
            val_metrics = self._validate(
                'face_recognition',
                val_loader
            )
            
            # Update scheduler
            scheduler.step()
            
            # Log metrics
            self._log_metrics('face_recognition', epoch, train_metrics, val_metrics)
            
            # Save best model
            if val_metrics['accuracy'] > best_metrics['val_accuracy']:
                best_metrics = val_metrics
                self._save_model('face_recognition')
        
        return best_metrics

    def train_iris_detection(self, train_loader: DataLoader, val_loader: DataLoader) -> Dict:
        """Train iris detection model"""
        logger.info("Training Iris Detection model...")
        model = self.models['iris_detection']
        optimizer = self.optimizers['iris_detection']
        scheduler = self.schedulers['iris_detection']
        config = self.config['iris_detection']['training']
        
        best_metrics = {'val_dice_score': 0.0}
        
        for epoch in range(config['epochs']):
            # Training phase
            model.train()
            train_metrics = self._train_epoch(
                'iris_detection',
                train_loader,
                optimizer
            )
            
            # Validation phase
            val_metrics = self._validate(
                'iris_detection',
                val_loader
            )
            
            # Update scheduler
            if isinstance(scheduler, torch.optim.lr_scheduler.ReduceLROnPlateau):
                scheduler.step(val_metrics['loss'])
            else:
                scheduler.step()
            
            # Log metrics
            self._log_metrics('iris_detection', epoch, train_metrics, val_metrics)
            
            # Save best model
            if val_metrics['dice_score'] > best_metrics['val_dice_score']:
                best_metrics = val_metrics
                self._save_model('iris_detection')
        
        return best_metrics

    def train_iris_recognition(self, train_loader: DataLoader, val_loader: DataLoader) -> Dict:
        """Train iris recognition model"""
        logger.info("Training Iris Recognition model...")
        model = self.models['iris_recognition']
        optimizer = self.optimizers['iris_recognition']
        scheduler = self.schedulers['iris_recognition']
        config = self.config['iris_recognition']['training']
        
        best_metrics = {'val_loss': float('inf')}
        
        for epoch in range(config['epochs']):
            # Training phase
            model.train()
            train_metrics = self._train_epoch(
                'iris_recognition',
                train_loader,
                optimizer
            )
            
            # Validation phase
            val_metrics = self._validate(
                'iris_recognition',
                val_loader
            )
            
            # Update scheduler
            scheduler.step()
            
            # Log metrics
            self._log_metrics('iris_recognition', epoch, train_metrics, val_metrics)
            
            # Save best model
            if val_metrics['loss'] < best_metrics['val_loss']:
                best_metrics = val_metrics
                self._save_model('iris_recognition')
        
        return best_metrics

    def _train_epoch(
        self,
        model_name: str,
        dataloader: DataLoader,
        optimizer: torch.optim.Optimizer
    ) -> Dict:
        """Train for one epoch"""
        model = self.models[model_name]
        total_loss = 0
        metrics = {}
        
        pbar = tqdm(dataloader, desc=f"Training {model_name}")
        for batch in pbar:
            optimizer.zero_grad()
            
            # Forward pass
            batch_metrics = model.train_step(**batch)
            loss = batch_metrics['loss']
            
            # Backward pass
            loss.backward()
            optimizer.step()
            
            # Update metrics
            total_loss += loss.item()
            for key, value in batch_metrics.items():
                if key not in metrics:
                    metrics[key] = []
                metrics[key].append(value)
            
            # Update progress bar
            pbar.set_postfix({'loss': loss.item()})
        
        # Calculate average metrics
        metrics = {k: sum(v) / len(v) for k, v in metrics.items()}
        return metrics

    def _validate(self, model_name: str, dataloader: DataLoader) -> Dict:
        """Validate model"""
        model = self.models[model_name]
        model.eval()
        total_metrics = {}
        
        with torch.no_grad():
            for batch in dataloader:
                batch_metrics = model.train_step(**batch)
                
                # Update metrics
                for key, value in batch_metrics.items():
                    if key not in total_metrics:
                        total_metrics[key] = []
                    total_metrics[key].append(value)
        
        # Calculate average metrics
        metrics = {k: sum(v) / len(v) for k, v in total_metrics.items()}
        return metrics

    def _log_metrics(
        self,
        model_name: str,
        epoch: int,
        train_metrics: Dict,
        val_metrics: Dict
    ):
        """Log metrics to wandb and console"""
        if self.config['monitoring']['enable_wandb']:
            wandb.log({
                f"{model_name}/train/{k}": v for k, v in train_metrics.items()
            })
            wandb.log({
                f"{model_name}/val/{k}": v for k, v in val_metrics.items()
            })
        
        logger.info(
            f"Epoch {epoch} - {model_name} - "
            f"Train Loss: {train_metrics['loss']:.4f}, "
            f"Val Loss: {val_metrics['loss']:.4f}"
        )

    def _save_model(self, model_name: str):
        """Save model checkpoint"""
        save_path = Path(self.config['paths']['models_dir']) / f"{model_name}.pth"
        self.models[model_name].save_model(save_path)
        logger.info(f"Saved {model_name} model to {save_path}")

    def train_all(
        self,
        face_spoof_data: Dict[str, DataLoader],
        face_recognition_data: Dict[str, DataLoader],
        iris_detection_data: Dict[str, DataLoader],
        iris_recognition_data: Dict[str, DataLoader]
    ) -> Dict:
        """Train all models"""
        results = {}
        
        # Train face spoof detection
        results['face_spoof'] = self.train_face_spoof(
            face_spoof_data['train'],
            face_spoof_data['val']
        )
        
        # Train face recognition
        results['face_recognition'] = self.train_face_recognition(
            face_recognition_data['train'],
            face_recognition_data['val']
        )
        
        # Train iris detection
        results['iris_detection'] = self.train_iris_detection(
            iris_detection_data['train'],
            iris_detection_data['val']
        )
        
        # Train iris recognition
        results['iris_recognition'] = self.train_iris_recognition(
            iris_recognition_data['train'],
            iris_recognition_data['val']
        )
        
        return results

if __name__ == "__main__":
    # Example usage
    trainer = ModelTrainer()
    
    # Load your datasets and create dataloaders
    # train_all(face_spoof_data, face_recognition_data, iris_detection_data, iris_recognition_data)
