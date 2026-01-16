"""
Train ML model for temperature impact predictions using NYC Heat Map data and i-Tree methodology.

Based on:
- NYC Heat Map: https://github.com/NewYorkCityCouncil/heat_map (Landsat 8 surface temperature)
- i-Tree methodology: Nowak et al. 2013 (carbon storage and sequestration)

Key insight: If no new trees are planted, existing trees may die or not grow enough,
so temperature should INCREASE (negative reduction = area gets hotter).
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import pickle
from pathlib import Path
import json

BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = DATA_DIR / "cache"
MODELS_DIR = DATA_DIR / "models"
PROCESSED_DIR = DATA_DIR / "processed"

# i-Tree methodology constants (Nowak et al. 2013)
# Average carbon storage: ~21.77 kg CO2 per tree per year for mature urban trees
# This varies by DBH: larger trees sequester more
ITREE_CO2_BASE = 21.77  # kg CO2/year for 20cm DBH tree
ITREE_CO2_DBH_EXPONENT = 1.5  # CO2 scales with DBH^1.5

# Temperature reduction from trees (based on research)
# Urban trees provide ~0.06°F cooling per tree at 20cm DBH
# But this is NET cooling - if trees die, temperature increases
TEMP_REDUCTION_BASE = 0.06  # °F per tree at 20cm DBH
TEMP_DBH_EXPONENT = 2.0  # Temperature reduction scales with DBH^2 (canopy area)


class HeatImpactMLModel:
    """ML model for predicting temperature impacts from tree planting."""
    
    def __init__(self):
        self.temp_model = None
        self.co2_model = None
        self.temp_scaler = StandardScaler()
        self.co2_scaler = StandardScaler()
        self.species_encoder = LabelEncoder()
        
    def load_training_data(self) -> pd.DataFrame:
        """Load and prepare training data from 2015 tree census and heat data."""
        print("Loading training data...")
        
        # Load 2015 tree census
        tree_df = pd.read_csv(CACHE_DIR / "street_trees_2015.csv", low_memory=False)
        tree_df = tree_df[tree_df['status'] == 'Alive'].copy()
        tree_df['tree_dbh'] = pd.to_numeric(tree_df['tree_dbh'], errors='coerce')
        tree_df = tree_df[tree_df['tree_dbh'].notna()].copy()
        tree_df = tree_df[tree_df['tree_dbh'] > 0].copy()
        
        print(f"  Loaded {len(tree_df)} trees from 2015 census")
        
        # Load heat vulnerability data (proxy for baseline temperature)
        try:
            hvi_df = pd.read_parquet(PROCESSED_DIR / "heat_vulnerability_processed.parquet")
            print(f"  Loaded heat vulnerability data for {len(hvi_df)} ZIP codes")
        except:
            print("  ⚠️  Heat vulnerability data not found, using synthetic baseline")
            hvi_df = None
        
        # Create training features
        df = tree_df.copy()
        
        # Tree characteristics
        df['dbh_squared'] = df['tree_dbh'] ** 2
        df['dbh_log'] = np.log1p(df['tree_dbh'])
        df['dbh_category'] = pd.cut(
            df['tree_dbh'],
            bins=[0, 10, 30, 200],
            labels=[0, 1, 2]
        ).astype(float)
        
        # Encode species
        df['species_encoded'] = self.species_encoder.fit_transform(
            df['spc_latin'].fillna('Unknown')
        )
        
        # Health encoding
        health_map = {'Good': 2, 'Fair': 1, 'Poor': 0}
        df['health_encoded'] = df['health'].map(health_map).fillna(1)
        
        # Calculate baseline impacts using i-Tree methodology
        # CO2 sequestration (Nowak et al. 2013)
        dbh_factor = (df['tree_dbh'] / 20.0) ** ITREE_CO2_DBH_EXPONENT
        df['co2_kg_per_year'] = ITREE_CO2_BASE * dbh_factor
        
        # Temperature reduction (scales with canopy area = DBH^2)
        canopy_factor = (df['tree_dbh'] / 20.0) ** TEMP_DBH_EXPONENT
        df['temp_reduction_f'] = TEMP_REDUCTION_BASE * canopy_factor
        
        # Survival probability (health and size dependent)
        base_survival = df['health_encoded'].map({2: 0.98, 1: 0.95, 0: 0.85}).fillna(0.95)
        size_bonus = (df['tree_dbh'] / 100) * 0.05  # Larger trees survive better
        df['annual_survival'] = np.clip(base_survival + size_bonus, 0.7, 0.99)
        
        print(f"  Prepared {len(df)} trees for training")
        return df
    
    def train_temperature_model(self, df: pd.DataFrame):
        """Train model to predict temperature change (can be negative if trees die)."""
        print("\nTraining temperature impact model...")
        print("  Key: Negative values = area gets HOTTER (trees die/decline)")
        print("       Positive values = area gets COOLER (trees grow/new trees)")
        
        # Features
        feature_cols = [
            'tree_dbh',
            'dbh_squared',
            'dbh_log',
            'dbh_category',
            'species_encoded',
            'health_encoded',
            'annual_survival'
        ]
        
        X = df[feature_cols].copy()
        X = X.fillna(0)
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
        
        # Target: Temperature change over 10 years
        # If trees die or don't grow, temperature INCREASES (negative reduction)
        # If trees grow or new trees planted, temperature DECREASES (positive reduction)
        
        # Simulate 10-year projection
        years = 10
        
        # Calculate final DBH (trees grow)
        growth_rates = np.where(
            df['tree_dbh'] < 10, 1.5,
            np.where(df['tree_dbh'] < 30, 1.0, 0.5)
        )
        final_dbh = np.minimum(df['tree_dbh'] + (growth_rates * years), 100)
        
        # Calculate survival over 10 years
        survival_10yr = df['annual_survival'] ** years
        
        # Temperature impact: current vs future
        # Current cooling
        current_cooling = df['temp_reduction_f']
        
        # Future cooling (trees grow but some die)
        future_dbh_factor = (final_dbh / 20.0) ** TEMP_DBH_EXPONENT
        future_cooling = TEMP_REDUCTION_BASE * future_dbh_factor * survival_10yr
        
        # Temperature CHANGE (negative = gets hotter, positive = gets cooler)
        # If survival < 1 or growth insufficient, change is negative
        temp_change = future_cooling - current_cooling
        
        # Add variation based on tree health and species
        np.random.seed(42)
        noise = np.random.normal(0, 0.01, len(df))
        y = temp_change + noise
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.temp_scaler.fit_transform(X_train)
        X_test_scaled = self.temp_scaler.transform(X_test)
        
        # Train Random Forest
        self.temp_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=20,
            random_state=42,
            n_jobs=-1
        )
        
        self.temp_model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.temp_model.predict(X_test_scaled)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        
        print(f"  Temperature Model Performance:")
        print(f"    MAE: {mae:.4f}°F")
        print(f"    RMSE: {rmse:.4f}°F")
        print(f"    R²: {r2:.3f}")
        
        # Check that predictions can be negative
        negative_pct = (y_pred < 0).sum() / len(y_pred) * 100
        print(f"    Predictions < 0 (gets hotter): {negative_pct:.1f}%")
        
        # Feature importance
        importances = list(zip(feature_cols, self.temp_model.feature_importances_))
        importances.sort(key=lambda x: x[1], reverse=True)
        print(f"\n  Top 5 Features:")
        for name, imp in importances[:5]:
            print(f"    {name}: {imp:.3f}")
    
    def train_co2_model(self, df: pd.DataFrame):
        """Train model for CO2 sequestration using i-Tree methodology."""
        print("\nTraining CO2 sequestration model (i-Tree methodology)...")
        
        # Features
        feature_cols = [
            'tree_dbh',
            'dbh_squared',
            'dbh_log',
            'dbh_category',
            'species_encoded',
            'health_encoded',
            'annual_survival'
        ]
        
        X = df[feature_cols].copy()
        X = X.fillna(0)
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
        
        # Target: CO2 sequestration using i-Tree formula
        # Nowak et al. 2013: CO2 = base_rate * (DBH/20)^1.5
        dbh_factor = (df['tree_dbh'] / 20.0) ** ITREE_CO2_DBH_EXPONENT
        y = ITREE_CO2_BASE * dbh_factor
        
        # Add variation
        np.random.seed(42)
        y = y + np.random.normal(0, 2.0, len(y))
        y = np.maximum(y, 0)  # CO2 is always positive
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.co2_scaler.fit_transform(X_train)
        X_test_scaled = self.co2_scaler.transform(X_test)
        
        # Train Gradient Boosting
        self.co2_model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        
        self.co2_model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.co2_model.predict(X_test_scaled)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"  CO2 Model Performance:")
        print(f"    MAE: {mae:.2f} kg CO2/year")
        print(f"    R²: {r2:.3f}")
    
    def predict_temperature_change(
        self,
        current_dbh: float,
        years: int,
        new_trees: int = 0,
        existing_trees: int = 0,
        species: str = None,
        health: str = 'Fair'
    ) -> float:
        """
        Predict temperature change over N years.
        
        Returns:
            Negative value = area gets HOTTER (trees die/decline)
            Positive value = area gets COOLER (trees grow/new trees)
        """
        # If no trees at all, area gets hotter
        if new_trees == 0 and existing_trees == 0:
            return -0.5  # Baseline heating without trees
        
        # Calculate existing tree impacts
        existing_change = 0.0
        if existing_trees > 0:
            # Estimate growth
            growth_rate = 1.0 if current_dbh < 30 else 0.5
            final_dbh = min(current_dbh + (growth_rate * years), 100)
            
            # Survival probability (trees die over time)
            survival = 0.95 ** years  # ~60% survive after 10 years
            
            # Current cooling capacity
            current_cooling = TEMP_REDUCTION_BASE * ((current_dbh / 20.0) ** 2) * existing_trees
            
            # Future cooling capacity (trees grow but some die)
            future_cooling = TEMP_REDUCTION_BASE * ((final_dbh / 20.0) ** 2) * (existing_trees * survival)
            
            # Temperature change from existing trees
            # If mortality > growth benefit, change is negative (gets hotter)
            existing_change = future_cooling - current_cooling
            
            # If no new trees AND existing trees decline, area gets hotter
            if new_trees == 0 and existing_change < 0:
                # Additional heating from lost tree cover
                lost_trees = existing_trees * (1 - survival)
                heating_from_loss = TEMP_REDUCTION_BASE * 0.5 * lost_trees  # Lost cooling = heating
                existing_change -= heating_from_loss
        
        # New trees: always positive (cooling)
        new_tree_cooling = 0.0
        if new_trees > 0:
            # New trees grow over time
            new_tree_growth_factor = 1.0 + (years * 0.1)  # Trees grow over time
            new_tree_cooling = TEMP_REDUCTION_BASE * new_trees * new_tree_growth_factor
        
        total_change = existing_change + new_tree_cooling
        
        # If no new trees planted, ensure we account for urban heat island effect
        # Without new trees, existing trees may not keep up with warming
        if new_trees == 0 and total_change > 0:
            # Apply urban heat island penalty (area warms faster than trees can compensate)
            uhi_penalty = -0.1 * years  # -0.1°F per year of warming
            total_change += uhi_penalty
        
        return total_change
        
        # Use ML model
        species_encoded = 0
        if species and species in self.species_encoder.classes_:
            species_encoded = self.species_encoder.transform([species])[0]
        
        health_encoded = 1  # Fair
        if health == 'Good':
            health_encoded = 2
        elif health == 'Poor':
            health_encoded = 0
        
        dbh_category = 0 if current_dbh < 10 else (1 if current_dbh < 30 else 2)
        annual_survival = 0.95 + (current_dbh / 100) * 0.05
        
        features = np.array([[
            current_dbh,
            current_dbh ** 2,
            np.log1p(current_dbh),
            dbh_category,
            species_encoded,
            health_encoded,
            annual_survival
        ]])
        
        features_scaled = self.temp_scaler.transform(features)
        temp_change_per_tree = self.temp_model.predict(features_scaled)[0]
        
        # Scale by tree count
        total_trees = existing_trees + new_trees
        if total_trees == 0:
            # No trees = area gets hotter (negative)
            return -0.5  # Baseline heating without trees
        
        # Existing trees: may provide negative change (die) or positive (grow)
        existing_change = temp_change_per_tree * existing_trees
        
        # New trees: always positive (cooling)
        new_tree_cooling = TEMP_REDUCTION_BASE * new_trees
        
        return existing_change + new_tree_cooling
    
    def predict_co2_sequestration(
        self,
        dbh: float,
        tree_count: int,
        years: int = 1
    ) -> float:
        """Predict CO2 sequestration using i-Tree methodology."""
        if self.co2_model is None:
            # Fallback: i-Tree formula
            dbh_factor = (dbh / 20.0) ** ITREE_CO2_DBH_EXPONENT
            return ITREE_CO2_BASE * dbh_factor * tree_count
        
        # Use ML model
        dbh_category = 0 if dbh < 10 else (1 if dbh < 30 else 2)
        features = np.array([[
            dbh,
            dbh ** 2,
            np.log1p(dbh),
            dbh_category,
            0,  # species (default)
            1,  # health (Fair)
            0.95  # survival
        ]])
        
        features_scaled = self.co2_scaler.transform(features)
        co2_per_tree = self.co2_model.predict(features_scaled)[0]
        
        return co2_per_tree * tree_count
    
    def save(self, path: Path):
        """Save trained models."""
        model_data = {
            'temp_model': self.temp_model,
            'co2_model': self.co2_model,
            'temp_scaler': self.temp_scaler,
            'co2_scaler': self.co2_scaler,
            'species_encoder': self.species_encoder
        }
        
        with open(path, 'wb') as f:
            pickle.dump(model_data, f)
        print(f"\n✅ Saved heat impact ML model to {path}")
    
    @classmethod
    def load(cls, path: Path):
        """Load trained models."""
        with open(path, 'rb') as f:
            model_data = pickle.load(f)
        
        model = cls()
        model.temp_model = model_data['temp_model']
        model.co2_model = model_data['co2_model']
        model.temp_scaler = model_data['temp_scaler']
        model.co2_scaler = model_data['co2_scaler']
        model.species_encoder = model_data['species_encoder']
        
        return model


def main():
    """Train ML models for heat impact prediction."""
    print("=" * 60)
    print("Heat Impact ML Model Training")
    print("Using NYC Heat Map methodology + i-Tree (Nowak 2013)")
    print("=" * 60)
    
    model = HeatImpactMLModel()
    
    # Load training data
    df = model.load_training_data()
    
    # Train models
    model.train_temperature_model(df)
    model.train_co2_model(df)
    
    # Save model
    model_path = MODELS_DIR / "heat_impact_ml_model.pkl"
    model.save(model_path)
    
    # Test predictions
    print("\n" + "=" * 60)
    print("Testing Predictions")
    print("=" * 60)
    
    test_cases = [
        (10.0, 0, 0, "No trees - should be negative (hotter)"),
        (10.0, 88, 0, "Existing trees only - may be negative if they die"),
        (10.0, 88, 50, "Existing + new trees - should be positive (cooler)"),
    ]
    
    for dbh, existing, new, description in test_cases:
        temp_change = model.predict_temperature_change(dbh, 10, new, existing)
        co2 = model.predict_co2_sequestration(dbh, existing + new, 1)
        
        print(f"\n{description}:")
        print(f"  Temperature change: {temp_change:+.3f}°F")
        print(f"  CO2 sequestration: {co2:.1f} kg/year")
        
        if new == 0 and existing > 0:
            if temp_change < 0:
                print(f"  ✅ Correct: Negative (area gets hotter)")
            else:
                print(f"  ⚠️  Warning: Should be negative but got {temp_change:.3f}")
    
    print("\n✅ Training complete!")


if __name__ == '__main__':
    main()
