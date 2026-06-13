"""
Model evaluation script for exoplanet detection
"""

import numpy as np
import pandas as pd
import pickle
import json
import argparse
import logging
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    roc_auc_score,
    roc_curve,
)

import matplotlib.pyplot as plt
import seaborn as sns

from data_loader import load_exoplanet_csv
from preprocess import preprocess_features

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def load_model_and_scaler(model_path: str):
    """Load trained model and associated scaler and config"""
    model_path = Path(model_path)
    
    # Load model
    with open(model_path, "rb") as f:
        model = pickle.load(f)

    # Load scaler
    scaler_path = model_path.parent / "scaler.pkl"
    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)

    # Load config
    config_path = model_path.parent / "model_config.json"
    with open(config_path, "r") as f:
        config = json.load(f)

    return model, scaler, config

def plot_confusion_matrix(y_true, y_pred, save_path=None):
    """Plot confusion matrix"""
    cm = confusion_matrix(y_true, y_pred)

    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", 
                xticklabels=["No Exoplanet", "Exoplanet"],
                yticklabels=["No Exoplanet", "Exoplanet"])
    plt.title("Confusion Matrix")
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")

    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches="tight")
        logger.info(f"Confusion matrix saved to {save_path}")
    else:
        plt.show()

    plt.close()

def main():
    parser = argparse.ArgumentParser(description="Evaluate trained exoplanet detection model")
    parser.add_argument(
        "--model",
        type=str,
        default="ml/models/model.pkl",
        help="Path to saved model file (default: ml/models/model.pkl)",
    )
    parser.add_argument(
        "--data",
        type=str,
        default="ml/data/raw/kepler_koi_20260613.csv",
        help="Path to dataset CSV for evaluation",
    )
    parser.add_argument(
        "--label-column",
        type=str,
        default="koi_disposition",
        help="Name of label column (default: koi_disposition)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="ml/results",
        help="Directory to save evaluation results (default: ml/results)",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for data split consistency",
    )

    args = parser.parse_args()

    # Create output directory
    output_path = Path(args.output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # 1. Load model, scaler, and config
    logger.info("Step 1: Loading model, scaler, and config...")
    model, scaler, config = load_model_and_scaler(args.model)
    logger.info(f"Model framework: {config.get('model_type', 'Unknown')}")
    logger.info(f"Features: {len(config.get('feature_names', []))} dimensions")

    # 2. Load data
    logger.info("Step 2: Loading dataset for evaluation...")
    df = load_exoplanet_csv(args.data)

    # 3. Preprocess features using the scaler we fit during training
    logger.info("Step 3: Preprocessing features...")
    
    # Run preprocess_features to align missing values, categorical encoding, and apply loaded scaler
    X_scaled, y = preprocess_features(
        df, 
        label_column=args.label_column, 
        extract_flux_features=False, # match training settings
        scaler=scaler,
    )

    # Split using the same test size and random state to isolate the test set
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=args.random_state, stratify=y
    )

    # 4. Predict
    logger.info("Step 4: Making predictions on test set...")
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None

    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    metrics = {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1
    }
    
    if y_pred_proba is not None:
        metrics["roc_auc"] = roc_auc_score(y_test, y_pred_proba)

    logger.info("=" * 60)
    logger.info("EVALUATION RESULTS")
    logger.info("=" * 60)
    logger.info(f"Accuracy:  {accuracy:.4f}")
    logger.info(f"Precision: {precision:.4f}")
    logger.info(f"Recall:    {recall:.4f}")
    logger.info(f"F1 Score:  {f1:.4f}")
    if "roc_auc" in metrics:
        logger.info(f"ROC AUC:   {metrics['roc_auc']:.4f}")
    logger.info("=" * 60)

    # Save metrics JSON
    metrics_file = output_path / "evaluation_metrics.json"
    with open(metrics_file, "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Metrics saved to {metrics_file}")

    # Plot and save confusion matrix
    cm_path = output_path / "confusion_matrix.png"
    plot_confusion_matrix(y_test, y_pred, save_path=cm_path)

if __name__ == "__main__":
    main()
