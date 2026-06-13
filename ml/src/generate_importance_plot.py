"""
Generate feature importance plot for the trained Random Forest model
"""

import pickle
import json
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from pathlib import Path

def main():
    model_path = Path("ml/models/model.pkl")
    config_path = Path("ml/models/model_config.json")
    output_path = Path("ml/results/feature_importance.png")
    
    # Load model and config
    with open(model_path, "rb") as f:
        model = pickle.load(f)
        
    with open(config_path, "r") as f:
        config = json.load(f)
        
    feature_names = config.get("feature_names", [])
    
    # Get feature importances
    importances = model.feature_importances_
    
    # Create DataFrame
    df_imp = pd.DataFrame({
        "Feature": feature_names,
        "Importance": importances
    }).sort_values("Importance", ascending=False)
    
    # Take top 10 features
    df_imp_top = df_imp.head(10)
    
    # Plot
    plt.figure(figsize=(10, 6))
    sns.barplot(
        x="Importance", 
        y="Feature", 
        data=df_imp_top, 
        palette="viridis",
        hue="Feature",
        legend=False
    )
    plt.title("Top 10 Feature Importances (Random Forest)")
    plt.xlabel("Importance Score")
    plt.ylabel("Feature")
    plt.grid(True, alpha=0.3)
    
    # Save
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    print(f"Feature importance plot saved to {output_path}")
    plt.close()

if __name__ == "__main__":
    main()
