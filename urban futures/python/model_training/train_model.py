"""
Train neural network model for impact prediction.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import json
from pathlib import Path
import pickle

BASE_DIR = Path(__file__).parent.parent.parent
MODEL_DIR = BASE_DIR / "data" / "models"


def create_synthetic_training_data(features_df):
    """Create synthetic training data based on literature priors."""
    n_samples = len(features_df)
    
    # Literature priors:
    # ~2°F cooling per tree (baseline)
    # ~0.16 lbs PM2.5 removed/tree/year
    
    # Simulate impact based on features (reduced noise for better signal)
    heat_impact = features_df['heat_score'] * 2.0  # Max 2°F reduction
    air_impact = features_df['air_score'] * 0.16  # Max 0.16 lbs/tree/year
    
    # Add reduced noise (was 0.2, now 0.1 for temp; was 0.02, now 0.01 for PM2.5)
    np.random.seed(42)
    temp_reduction = heat_impact + np.random.normal(0, 0.1, n_samples)
    pm25_reduction = air_impact + np.random.normal(0, 0.01, n_samples)
    
    # Ensure non-negative
    temp_reduction = np.maximum(temp_reduction, 0)
    pm25_reduction = np.maximum(pm25_reduction, 0)
    
    # Compute impact index (weighted combination)
    impact_index = 0.6 * (temp_reduction / 2.0) + 0.4 * (pm25_reduction / 0.16)
    
    # Estimate cost per tree (simplified: $500-$2000 based on location)
    # Add some variation based on tree_density (harder to plant in dense areas)
    base_cost = 500 + features_df['ej_score'] * 1500
    density_factor = 1 + features_df['tree_density'] * 0.3  # Up to 30% more expensive
    cost_per_tree = base_cost * density_factor
    
    # Impact per dollar
    impact_per_dollar = impact_index / (cost_per_tree / 1000)  # Normalize cost
    
    return {
        'temp_reduction_F': temp_reduction,
        'pm25_reduction_lbs_per_year': pm25_reduction,
        'impact_index': impact_index,
        'impact_per_dollar': impact_per_dollar,
        'cost_per_tree': cost_per_tree
    }


def prepare_features(features_df):
    """Prepare feature vector for model with engineering."""
    df = features_df.copy()
    
    # Fill NaN values
    df['heat_score'] = df['heat_score'].fillna(df['heat_score'].median())
    df['air_quality_score'] = df['air_quality_score'].fillna(df['air_quality_score'].mean())
    df['tree_density'] = df['tree_density'].fillna(0)
    df['total_fuel_oil_gallons'] = df['total_fuel_oil_gallons'].fillna(0)
    df['ej_score'] = df['ej_score'].fillna(df['ej_score'].median())
    df['pollution_proxy'] = df['pollution_proxy'].fillna(0)
    
    # Normalize cooling_site_distance (inverse, so closer = higher)
    cooling_dist = df['cooling_site_distance'].replace([np.inf, -np.inf], np.nan)
    df['cooling_site_distance_norm'] = 1 / (1 + cooling_dist.fillna(100) / 10)
    df['cooling_site_distance_norm'] = df['cooling_site_distance_norm'].fillna(0)
    
    # Feature engineering:
    # 1. Log transform fuel oil (handles large values better)
    df['fuel_oil_log'] = np.log1p(df['total_fuel_oil_gallons'])  # log1p handles zeros
    
    # 2. Interaction terms (key relationships)
    df['heat_x_ej'] = df['heat_score'] * df['ej_score']
    df['air_x_ej'] = df['air_quality_score'] * df['ej_score']
    df['heat_x_air'] = df['heat_score'] * df['air_quality_score']
    df['tree_gap_x_ej'] = (1 - df['tree_density']) * df['ej_score']
    
    # 3. Combined priority indicators
    df['heat_air_combined'] = (df['heat_score'] + df['air_quality_score']) / 2
    
    # Select only meaningful features (removed placeholders)
    feature_cols = [
        'heat_score',
        'air_quality_score',
        'tree_density',
        'cooling_site_distance_norm',
        'ej_score',
        'pollution_proxy',
        'fuel_oil_log',  # Log-transformed
        'heat_x_ej',  # Interaction
        'air_x_ej',  # Interaction
        'heat_x_air',  # Interaction
        'tree_gap_x_ej',  # Interaction
        'heat_air_combined',  # Combined feature
    ]
    
    X = df[feature_cols].values
    
    return X, feature_cols


def train_random_forest(X, y, n_estimators=100, max_depth=15):
    """Train Random Forest model (non-linear, handles interactions)."""
    from sklearn.ensemble import RandomForestRegressor
    
    model = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X, y)
    
    return model


def train_gradient_boosting(X, y):
    """Train Gradient Boosting model (alternative non-linear option)."""
    from sklearn.ensemble import GradientBoostingRegressor
    
    model = GradientBoostingRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    model.fit(X, y)
    
    return model


def save_model_weights(model, scaler, output_path, feature_names, model_type='random_forest'):
    """Save model weights in format compatible with C++ inference."""
    if model_type == 'random_forest':
        # For Random Forest, save feature importances and use mean prediction
        # Note: Full RF can't be easily exported to C++, so we'll use a simplified approach
        # In production, you'd use ONNX or similar for model export
        weights = {
            'model_type': 'random_forest',
            'n_estimators': model.n_estimators,
            'feature_importances': model.feature_importances_.tolist(),
            'feature_names': feature_names,
            'scaler_mean': scaler.mean_.tolist(),
            'scaler_scale': scaler.scale_.tolist(),
            'n_features': len(feature_names),
            'note': 'Full RF model saved separately as pickle. This JSON contains metadata.'
        }
        
        # Also save the full model as pickle for Python inference
        pickle_path = str(output_path).replace('.bin', '.pkl')
        with open(pickle_path, 'wb') as f:
            pickle.dump(model, f)
        print(f"Saved full RF model to {pickle_path}")
    else:
        # Linear model fallback
        weights = {
            'coef': model.coef_.tolist(),
            'intercept': model.intercept_,
            'scaler_mean': scaler.mean_.tolist(),
            'scaler_scale': scaler.scale_.tolist(),
            'n_features': len(model.coef_)
        }
    
    with open(output_path, 'w') as f:
        json.dump(weights, f, indent=2)
    
    print(f"Saved model weights to {output_path}")


def main():
    """Main training function."""
    print("Loading features...")
    features_path = MODEL_DIR / "zip_features.parquet"
    features_df = pd.read_parquet(features_path)
    
    # Drop rows with NaN priority_final (these are likely outside NYC)
    features_df = features_df.dropna(subset=['priority_final'])
    
    print(f"Using {len(features_df)} ZIP codes for training")
    
    print("Creating synthetic training data...")
    targets = create_synthetic_training_data(features_df)
    
    print("Preparing features with engineering...")
    X, feature_names = prepare_features(features_df)
    
    # Check for any remaining NaN or inf values
    if np.isnan(X).any() or np.isinf(X).any():
        print("Warning: Found NaN or inf values, replacing...")
        X = np.nan_to_num(X, nan=0.0, posinf=1e6, neginf=-1e6)
    
    # Scale features (RF doesn't strictly need it, but helps with feature importance)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled,
        targets['impact_per_dollar'],
        test_size=0.2,
        random_state=42
    )
    
    print("\nTraining Random Forest model...")
    model = train_random_forest(X_train, y_train, n_estimators=150, max_depth=15)
    
    # Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    
    print(f"\nModel Performance:")
    print(f"Train R²: {train_score:.4f}")
    print(f"Test R²: {test_score:.4f}")
    
    # Feature importance
    print(f"\nTop 5 Feature Importances:")
    feature_importance = list(zip(feature_names, model.feature_importances_))
    feature_importance.sort(key=lambda x: x[1], reverse=True)
    for name, importance in feature_importance[:5]:
        print(f"  {name}: {importance:.4f}")
    
    # Also train separate models for impact_index and cost_per_tree
    print("\nTraining separate models for impact_index and cost_per_tree...")
    
    # Get indices for train/test split (use same split as main model)
    indices = np.arange(len(features_df))
    train_indices, test_indices = train_test_split(
        indices,
        test_size=0.2,
        random_state=42
    )
    
    # Model for impact_index
    y_impact_all = targets['impact_index']
    y_impact_train = y_impact_all[train_indices]
    y_impact_test = y_impact_all[test_indices]
    model_impact = train_random_forest(X_train, y_impact_train, n_estimators=100, max_depth=12)
    impact_train_score = model_impact.score(X_train, y_impact_train)
    impact_test_score = model_impact.score(X_test, y_impact_test)
    print(f"Impact Index - Train R²: {impact_train_score:.4f}, Test R²: {impact_test_score:.4f}")
    
    # Model for cost_per_tree
    y_cost_all = targets['cost_per_tree']
    y_cost_train = y_cost_all[train_indices]
    y_cost_test = y_cost_all[test_indices]
    model_cost = train_random_forest(X_train, y_cost_train, n_estimators=100, max_depth=10)
    cost_train_score = model_cost.score(X_train, y_cost_train)
    cost_test_score = model_cost.score(X_test, y_cost_test)
    print(f"Cost per Tree - Train R²: {cost_train_score:.4f}, Test R²: {cost_test_score:.4f}")
    
    # Save main model
    weights_path = MODEL_DIR / "impact_model.bin"
    save_model_weights(model, scaler, weights_path, feature_names, model_type='random_forest')
    
    # Save separate models
    impact_path = MODEL_DIR / "impact_index_model.pkl"
    cost_path = MODEL_DIR / "cost_per_tree_model.pkl"
    with open(impact_path, 'wb') as f:
        pickle.dump(model_impact, f)
    with open(cost_path, 'wb') as f:
        pickle.dump(model_cost, f)
    print(f"\nSaved separate models:")
    print(f"  Impact Index: {impact_path}")
    print(f"  Cost per Tree: {cost_path}")
    
    # Save scaler and feature names
    scaler_path = MODEL_DIR / "scaler.pkl"
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    
    feature_names_path = MODEL_DIR / "feature_names.json"
    with open(feature_names_path, 'w') as f:
        json.dump(feature_names, f, indent=2)
    
    print("\nTraining complete!")


if __name__ == "__main__":
    main()

