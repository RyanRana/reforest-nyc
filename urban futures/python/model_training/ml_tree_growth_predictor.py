"""
ML-based Tree Growth Predictor using trained models from 2015 census data.

This replaces the rule-based predictor with ML models that learn from actual tree data.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Optional
import pickle

BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = DATA_DIR / "models"

# Import the ML model class
import sys
sys.path.insert(0, str(Path(__file__).parent))
from train_growth_model import TreeGrowthMLModel


class MLTreeGrowthPredictor:
    """
    ML-based tree growth predictor.
    
    Uses trained Random Forest and Gradient Boosting models to predict:
    - Growth rates based on DBH, species, health
    - Survival probabilities based on tree characteristics
    """
    
    def __init__(self, model_path: Optional[Path] = None):
        """Initialize predictor with trained ML models."""
        if model_path is None:
            model_path = MODELS_DIR / "tree_growth_ml_model.pkl"
        
        if model_path.exists():
            print(f"Loading ML model from {model_path}...")
            self.ml_model = TreeGrowthMLModel.load(model_path)
            print("✅ ML model loaded!")
        else:
            print(f"⚠️  ML model not found at {model_path}")
            print("   Falling back to rule-based predictions")
            self.ml_model = None
        
        # Base rates for impact calculations (from research)
        self.base_co2_rate = 21.77  # kg CO2/year for 20cm DBH tree
        self.base_temp_reduction = 0.06  # °F per tree at 20cm DBH
        self.base_pm25_rate = 0.18  # lbs/year at 20cm DBH
    
    def predict_dbh(self, current_dbh: float, years: int, species: str = None, health: str = 'Fair') -> float:
        """
        Predict DBH after N years using ML model.
        
        Args:
            current_dbh: Current diameter at breast height (cm)
            years: Number of years to project forward
            species: Tree species (optional)
            health: Tree health status (Good/Fair/Poor)
        """
        if years <= 0:
            return current_dbh
        
        predicted_dbh = current_dbh
        for year in range(years):
            # Get growth rate from ML model
            if self.ml_model:
                growth_rate = self.ml_model.predict_growth_rate(predicted_dbh, species, health)
            else:
                # Fallback to rule-based
                if predicted_dbh < 10:
                    growth_rate = 1.5
                elif predicted_dbh < 30:
                    growth_rate = 1.0
                else:
                    growth_rate = 0.5
            
            # Cap growth at 100cm DBH
            if predicted_dbh < 100:
                predicted_dbh += growth_rate
            else:
                predicted_dbh += 0.1
        
        return min(predicted_dbh, 100)
    
    def predict_survival(self, years: int, dbh: float = 20.0, species: str = None, health: str = 'Fair') -> float:
        """
        Predict survival probability after N years using ML model.
        
        Args:
            years: Number of years
            dbh: Current DBH (affects survival)
            species: Tree species (optional)
            health: Tree health status
        """
        if self.ml_model:
            return self.ml_model.predict_survival(dbh, years, species, health)
        else:
            # Fallback: 2% annual mortality
            return (1 - 0.02) ** years
    
    def predict_co2_sequestration(self, dbh: float, years: int) -> Dict[str, float]:
        """
        Predict CO2 sequestration over N years.
        
        Uses size-dependent scaling: larger trees sequester more.
        """
        # Predict final DBH
        final_dbh = self.predict_dbh(dbh, years)
        
        # Size factor: (DBH/20)^1.5
        start_factor = (dbh / 20.0) ** 1.5
        end_factor = (final_dbh / 20.0) ** 1.5
        avg_factor = (start_factor + end_factor) / 2
        
        # Annual rate at final size
        annual_rate = self.base_co2_rate * end_factor
        
        # Survival probability
        survival_prob = self.predict_survival(years, dbh)
        
        # Cumulative over years (average rate)
        cumulative = self.base_co2_rate * avg_factor * years * survival_prob
        
        return {
            'annual_rate_kg_per_year': annual_rate * survival_prob,
            'cumulative_kg': cumulative
        }
    
    def predict_temperature_reduction(self, dbh: float, years: int, new_trees: int = 0) -> Dict[str, float]:
        """
        Predict temperature reduction over N years.
        
        Key: If new_trees = 0, temperature may INCREASE (negative reduction)
        because existing trees die and urban heat island effect worsens.
        
        Uses size-dependent scaling: larger trees provide more cooling.
        """
        final_dbh = self.predict_dbh(dbh, years)
        
        # Size factor: (DBH/20)^2 (canopy area scales with DBH²)
        start_factor = (dbh / 20.0) ** 2
        end_factor = (final_dbh / 20.0) ** 2
        avg_factor = (start_factor + end_factor) / 2
        
        # Survival probability (trees die over time)
        survival_prob = self.predict_survival(years, dbh)
        
        # Current cooling from existing trees
        current_cooling = self.base_temp_reduction * start_factor
        
        # Future cooling from surviving trees (they grow but some die)
        future_cooling = self.base_temp_reduction * end_factor * survival_prob
        
        # Temperature CHANGE (negative = gets hotter, positive = gets cooler)
        temp_change = future_cooling - current_cooling
        
        # If no new trees planted, account for:
        # 1. Tree mortality (lost cooling = heating)
        if new_trees == 0:
            mortality_penalty = -self.base_temp_reduction * (1 - survival_prob) * 0.5
            temp_change += mortality_penalty
            
            # 2. Urban heat island effect (area warms faster without new trees)
            uhi_penalty = -0.01 * years  # -0.01°F per year
            temp_change += uhi_penalty
        
        # New trees: always provide cooling
        if new_trees > 0:
            new_tree_cooling = self.base_temp_reduction * new_trees * (1 + years * 0.05)
            temp_change += new_tree_cooling
        
        # Annual reduction (can be negative if area gets hotter)
        annual_reduction = temp_change / years if years > 0 else temp_change
        
        # Cumulative (sum of annual changes)
        cumulative = temp_change * years
        
        return {
            'annual_reduction_f': annual_reduction,
            'cumulative_cooling_degree_days': cumulative,
            'temperature_change_f': temp_change  # Total change over years
        }
    
    def predict_pm25_reduction(self, dbh: float, years: int) -> Dict[str, float]:
        """
        Predict PM2.5 reduction over N years.
        
        Uses size-dependent scaling: larger trees filter more air.
        """
        final_dbh = self.predict_dbh(dbh, years)
        
        # Size factor: (DBH/20)^1.5 (leaf surface area)
        start_factor = (dbh / 20.0) ** 1.5
        end_factor = (final_dbh / 20.0) ** 1.5
        avg_factor = (start_factor + end_factor) / 2
        
        # Annual rate at final size
        annual_rate = self.base_pm25_rate * end_factor
        
        # Survival probability
        survival_prob = self.predict_survival(years, dbh)
        
        # Cumulative over years
        cumulative = self.base_pm25_rate * avg_factor * years * survival_prob
        
        return {
            'annual_reduction_lbs_per_year': annual_rate * survival_prob,
            'cumulative_lbs': cumulative
        }
    
    def predict_tree_impacts(
        self,
        current_dbh: float,
        years: int,
        species: str = None,
        health: str = 'Fair',
        new_trees: int = 0
    ) -> Dict[str, any]:
        """
        Predict all impacts for a single tree over N years using ML models.
        
        Args:
            current_dbh: Current diameter at breast height (cm)
            years: Number of years to project forward
            species: Tree species (optional, for ML predictions)
            health: Tree health status (Good/Fair/Poor)
            new_trees: Number of new trees planted (0 = only existing trees)
            
        Returns:
            Dictionary with all predicted impacts
        """
        predicted_dbh = self.predict_dbh(current_dbh, years, species, health)
        survival_prob = self.predict_survival(years, current_dbh, species, health)
        
        co2 = self.predict_co2_sequestration(current_dbh, years)
        temp = self.predict_temperature_reduction(current_dbh, years, new_trees)
        pm25 = self.predict_pm25_reduction(current_dbh, years)
        
        return {
            'years_projected': years,
            'current_dbh_cm': current_dbh,
            'predicted_dbh_cm': predicted_dbh,
            'dbh_growth_cm': predicted_dbh - current_dbh,
            'survival_probability': survival_prob,
            'co2_sequestration': co2,
            'temperature_reduction': temp,
            'pm25_reduction': pm25
        }
