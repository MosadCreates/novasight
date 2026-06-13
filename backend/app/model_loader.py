"""
Modular model loader supporting multiple ML frameworks (PyTorch, TensorFlow, scikit-learn)
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, List, Tuple, Any
import numpy as np
import pickle
import json
from app.models import PredictionClass, FeatureImportance, PredictionExplanation


class BaseModelLoader(ABC):
    """Abstract base class for model loaders"""

    def __init__(self, model_path: str, config_path: str = None):
        """
        Initialize model loader

        Args:
            model_path: Path to the model file
            config_path: Path to configuration file (optional)
        """
        self.model_path = Path(model_path)
        self.config_path = (
            Path(config_path) if config_path else self.model_path.parent / "model_config.json"
        )
        self.scaler_path = self.model_path.parent / "scaler.pkl"
        self.model = None
        self.scaler = None
        self.config = {}
        self.feature_names = []

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model file not found: {self.model_path}. "
                "Please train a model first using ml/src/train.py"
            )

    @abstractmethod
    def load_model(self):
        """Load the model from disk"""
        pass

    @abstractmethod
    def predict(self, features: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make predictions

        Args:
            features: Input features as numpy array

        Returns:
            Tuple of (predictions, probabilities)
        """
        pass

    @abstractmethod
    def get_feature_importance(self, features: np.ndarray) -> List[Dict[str, float]]:
        """
        Get feature importance for the prediction

        Args:
            features: Input features

        Returns:
            List of feature importance dictionaries
        """
        pass

    def load_config(self):
        """Load model configuration"""
        if self.config_path.exists():
            with open(self.config_path, "r") as f:
                self.config = json.load(f)
                self.feature_names = self.config.get("feature_names", [])

        # Load scaler if it exists
        if self.scaler_path.exists():
            try:
                with open(self.scaler_path, "rb") as f:
                    self.scaler = pickle.load(f)
            except Exception:
                pass

    def map_prediction_to_class(self, prediction, confidence: float) -> PredictionClass:
        """
        Map model prediction to PredictionClass.

        The sklearn model was trained on string labels (CONFIRMED, CANDIDATE,
        FALSE POSITIVE), so ``prediction`` may be a string or an integer.

        Args:
            prediction: Model prediction — either a string label or numeric (0/1/2)
            confidence: Confidence score

        Returns:
            PredictionClass enum value
        """
        # Handle string labels produced by sklearn when trained on string targets
        if isinstance(prediction, str):
            label = prediction.upper().strip()
            if "FALSE" in label or "FP" in label:
                return PredictionClass.FALSE_POSITIVE
            elif "CANDIDATE" in label:
                return PredictionClass.CANDIDATE if confidence < 0.8 else PredictionClass.CONFIRMED
            else:  # CONFIRMED or anything else
                return PredictionClass.CONFIRMED

        # Numeric label fallback (0 = false positive, 1 = candidate/confirmed, 2 = confirmed)
        if prediction == 0:
            return PredictionClass.FALSE_POSITIVE
        elif prediction == 1:
            return PredictionClass.CANDIDATE if confidence < 0.8 else PredictionClass.CONFIRMED
        else:
            return PredictionClass.CONFIRMED

    def prepare_features(self, feature_dict: Dict[str, float]) -> np.ndarray:
        """
        Prepare features from dictionary to numpy array

        Args:
            feature_dict: Dictionary of feature names and values

        Returns:
            Numpy array of features in correct order
        """
        # Map aliases to normalized feature names (matching those created by load_exoplanet_csv).
        # Covers both human-friendly names and raw koi_* column names from the Kepler dataset.
        aliases_map = {
            # Orbital period
            "koi_period": "orbital_period", "period": "orbital_period",
            "pl_orbper": "orbital_period", "period_days": "orbital_period",
            # Transit duration
            "koi_duration": "transit_duration", "duration": "transit_duration",
            "pl_trandur": "transit_duration", "transit_dur": "transit_duration",
            # Planet radius
            "koi_prad": "planet_radius", "radius": "planet_radius",
            "pl_radj": "planet_radius", "pl_rade": "planet_radius", "prad": "planet_radius",
            # Stellar temperature
            "koi_steff": "stellar_temp", "temperature": "stellar_temp",
            "st_teff": "stellar_temp", "teff": "stellar_temp", "star_temp": "stellar_temp",
        }
        normalized_features = {}
        for k, v in feature_dict.items():
            norm_k = aliases_map.get(k, k)
            normalized_features[norm_k] = v

        if not self.feature_names:
            # If no feature names in config, use dictionary order
            features_arr = np.array(list(normalized_features.values())).reshape(1, -1)
        else:
            # Ensure features are in the correct order
            features = []
            core_features = {"orbital_period", "transit_duration", "planet_radius", "stellar_temp"}
            for name in self.feature_names:
                if name not in normalized_features:
                    if name in core_features:
                        raise ValueError(f"Missing required core feature: {name}")
                    normalized_features[name] = 0.0
                features.append(normalized_features[name])
            features_arr = np.array(features).reshape(1, -1)

        # Scale features if scaler is loaded
        if self.scaler is not None:
            # Silence user warnings about feature names (StandardScaler expects feature names if fitted on DataFrame, but we pass numpy array)
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                features_arr = self.scaler.transform(features_arr)

        return features_arr


class PyTorchModelLoader(BaseModelLoader):
    """Model loader for PyTorch models"""

    def load_model(self):
        """Load PyTorch model"""
        try:
            import torch

            # Try loading as state dict first
            try:
                self.model = torch.load(self.model_path, map_location="cpu")
                if isinstance(self.model, dict):
                    # If it's a state dict, you need the model architecture
                    # This is a simplified version - adjust based on your model
                    raise ValueError(
                        "Loaded state dict, but model architecture not provided. "
                        "Save complete model using torch.save(model, path) instead."
                    )
            except Exception:
                # Try loading complete model
                self.model = torch.load(self.model_path, map_location="cpu")

            self.model.eval()
            self.load_config()

        except ImportError:
            raise ImportError("PyTorch not installed. Install with: pip install torch")

    def predict(self, features: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Make predictions with PyTorch model"""
        import torch

        with torch.no_grad():
            features_tensor = torch.FloatTensor(features)
            outputs = self.model(features_tensor)

            # Handle different output formats
            if isinstance(outputs, tuple):
                outputs = outputs[0]

            # Get probabilities
            if outputs.shape[-1] > 1:
                probs = torch.softmax(outputs, dim=-1).numpy()
                preds = np.argmax(probs, axis=-1)
            else:
                probs = torch.sigmoid(outputs).numpy()
                preds = (probs > 0.5).astype(int).flatten()
                probs = np.column_stack([1 - probs, probs])

        return preds, probs

    def get_feature_importance(self, features: np.ndarray) -> List[Dict[str, float]]:
        """Get feature importance using gradient-based method"""
        import torch

        # Simple gradient-based importance
        features_tensor = torch.FloatTensor(features)
        features_tensor.requires_grad = True

        outputs = self.model(features_tensor)
        if isinstance(outputs, tuple):
            outputs = outputs[0]

        # Get gradient
        outputs.sum().backward()
        importance = torch.abs(features_tensor.grad).squeeze().numpy()

        # Normalize
        if importance.sum() > 0:
            importance = importance / importance.sum()

        # Create feature importance list
        feature_importances = []
        for i, imp in enumerate(importance):
            name = self.feature_names[i] if i < len(self.feature_names) else f"feature_{i}"
            feature_importances.append({"name": name, "value": float(imp)})

        # Sort by importance and return top features
        feature_importances.sort(key=lambda x: x["value"], reverse=True)
        return feature_importances[:5]  # Top 5 features


class TensorFlowModelLoader(BaseModelLoader):
    """Model loader for TensorFlow/Keras models"""

    def load_model(self):
        """Load TensorFlow model"""
        try:
            import tensorflow as tf

            self.model = tf.keras.models.load_model(str(self.model_path))
            self.load_config()

        except ImportError:
            raise ImportError("TensorFlow not installed. Install with: pip install tensorflow")

    def predict(self, features: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Make predictions with TensorFlow model"""
        probs = self.model.predict(features, verbose=0)

        if probs.shape[-1] > 1:
            preds = np.argmax(probs, axis=-1)
        else:
            preds = (probs > 0.5).astype(int).flatten()
            probs = np.column_stack([1 - probs, probs])

        return preds, probs

    def get_feature_importance(self, features: np.ndarray) -> List[Dict[str, float]]:
        """Get feature importance using gradient-based method"""
        import tensorflow as tf

        features_tensor = tf.Variable(features, dtype=tf.float32)

        with tf.GradientTape() as tape:
            predictions = self.model(features_tensor)
            if predictions.shape[-1] > 1:
                # For multi-class, use max probability
                loss = tf.reduce_max(predictions)
            else:
                loss = tf.reduce_sum(predictions)

        gradients = tape.gradient(loss, features_tensor)
        importance = tf.abs(gradients).numpy().squeeze()

        # Normalize
        if importance.sum() > 0:
            importance = importance / importance.sum()

        # Create feature importance list
        feature_importances = []
        for i, imp in enumerate(importance):
            name = self.feature_names[i] if i < len(self.feature_names) else f"feature_{i}"
            feature_importances.append({"name": name, "value": float(imp)})

        # Sort by importance and return top features
        feature_importances.sort(key=lambda x: x["value"], reverse=True)
        return feature_importances[:5]  # Top 5 features


class ScikitLearnModelLoader(BaseModelLoader):
    """Model loader for scikit-learn models"""

    def load_model(self):
        """Load scikit-learn model"""
        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)

        # Force single-threaded inference to prevent parallel execution hangs on Windows under web servers
        if hasattr(self.model, "n_jobs"):
            self.model.n_jobs = 1

        self.load_config()

    def predict(self, features: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Make predictions with scikit-learn model"""
        preds = self.model.predict(features)

        # Try to get probabilities
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(features)
        elif hasattr(self.model, "decision_function"):
            # For SVM and similar models
            decision = self.model.decision_function(features)
            # Convert to probabilities using sigmoid
            probs = 1 / (1 + np.exp(-decision))
            probs = np.column_stack([1 - probs, probs])
        else:
            # No probability available, use predictions
            probs = np.zeros((len(preds), 2))
            probs[np.arange(len(preds)), preds] = 1.0

        return preds, probs

    def get_feature_importance(self, features: np.ndarray) -> List[Dict[str, float]]:
        """Get feature importance from model"""
        # Try to get feature importance from the model
        if hasattr(self.model, "feature_importances_"):
            importance = self.model.feature_importances_
        elif hasattr(self.model, "coef_"):
            # For linear models
            importance = np.abs(self.model.coef_).flatten()
            # Normalize
            if importance.sum() > 0:
                importance = importance / importance.sum()
        else:
            # Fallback: use feature values as proxy
            importance = np.abs(features).flatten()
            if importance.sum() > 0:
                importance = importance / importance.sum()

        # Create feature importance list
        feature_importances = []
        for i, imp in enumerate(importance):
            name = self.feature_names[i] if i < len(self.feature_names) else f"feature_{i}"
            feature_importances.append({"name": name, "value": float(imp)})

        # Sort by importance and return top features
        feature_importances.sort(key=lambda x: x["value"], reverse=True)
        return feature_importances[:5]  # Top 5 features


def get_model_loader(model_path: str, framework: str = None) -> BaseModelLoader:
    """
    Factory function to get appropriate model loader

    Args:
        model_path: Path to model file
        framework: Framework type ('pytorch', 'tensorflow', 'sklearn').
                  If None, auto-detect from file extension

    Returns:
        Appropriate model loader instance

    Raises:
        ValueError: If framework is invalid or cannot be detected
        FileNotFoundError: If model file doesn't exist
    """
    model_path = Path(model_path)

    # Auto-detect framework from file extension if not specified
    if framework is None:
        extension = model_path.suffix.lower()
        if extension in [".pt", ".pth"]:
            framework = "pytorch"
        elif extension in [".h5", ".keras"]:
            framework = "tensorflow"
        elif extension in [".pkl", ".pickle"]:
            framework = "sklearn"
        else:
            raise ValueError(
                f"Cannot auto-detect framework from extension '{extension}'. "
                "Please specify framework parameter."
            )

    # Return appropriate loader
    loaders = {
        "pytorch": PyTorchModelLoader,
        "tensorflow": TensorFlowModelLoader,
        "sklearn": ScikitLearnModelLoader,
    }

    framework = framework.lower()
    if framework not in loaders:
        raise ValueError(f"Invalid framework: {framework}. " f"Choose from: {list(loaders.keys())}")

    return loaders[framework](model_path)


def create_prediction_response(
    prediction: int,
    probabilities: np.ndarray,
    feature_importances: List[Dict[str, float]],
    loader: BaseModelLoader,
) -> Dict[str, Any]:
    """
    Create standardized prediction response

    Args:
        prediction: Numeric prediction
        probabilities: Probability array
        feature_importances: List of feature importance dicts
        loader: Model loader instance

    Returns:
        Dictionary formatted for PredictionResponse model
    """
    # Get confidence (max probability)
    confidence = float(np.max(probabilities))

    # Map to prediction class
    pred_class = loader.map_prediction_to_class(prediction, confidence)

    # Create feature importance objects
    top_features = [
        FeatureImportance(name=f["name"], value=f["value"]) for f in feature_importances
    ]

    return {
        "prediction": pred_class,
        "confidence": confidence,
        "explain": PredictionExplanation(top_features=top_features),
    }
