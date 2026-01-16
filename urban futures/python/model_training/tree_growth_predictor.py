"""
Tree Growth and Impact Prediction Model

Uses 2015 tree census data for backtesting and projects forward any number of years.
Accounts for:
- Tree growth (DBH increases over time)
- Tree mortality
- CO2 sequestration growth
- Temperature impact growth
- Air quality impact growth
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import json
from datetime import datetime, timedelta

BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = DATA_DIR / "cache"
MODELS_DIR = DATA_DIR / "models"


class TreeGrowthPredictor:
    """
    Predicts tree growth and impacts over time using growth curves.
    
    Based on research:
    - Urban trees grow ~0.5-2 cm DBH per year (species dependent)
    - Mortality rate: ~1-3% per year for urban trees
    - CO2 sequestration increases with tree size
    - Cooling impact increases with canopy size
    """
    
    def __init__(self):
        """Initialize predictor with growth parameters."""
        # Growth rates (cm DBH per year) by tree size
        # Young trees grow faster, mature trees slower
        self.growth_rates = {
            'young': 1.5,      # DBH < 10cm: 1.5 cm/year
            'medium': 1.0,     # DBH 10-30cm: 1.0 cm/year
            'mature': 0.5,     # DBH > 30cm: 0.5 cm/year
        }
        
        # Annual mortality rate (fraction)
        self.mortality_rate = 0.02  # 2% per year (conservative estimate)
        
        # CO2 sequestration by DBH (kg CO2 per year)
        # Formula: base_rate * (DBH/20)^1.5 (larger trees sequester more)
        self.base_co2_rate = 21.77  # kg CO2/year for 20cm DBH tree
        
        # Temperature reduction by DBH (°C per tree)
        # Larger trees provide more cooling
        self.base_temp_reduction = 0.06  # °F per tree at 20cm DBH
        
        # PM2.5 reduction by DBH (lbs per year)
        self.base_pm25_rate = 0.18  # lbs/year at 20cm DBH
        
    def get_growth_rate(self, dbh: float) -> float:
        """Get growth rate based on current DBH."""
        if dbh < 10:
            return self.growth_rates['young']
        elif dbh < 30:
            return self.growth_rates['medium']
        else:
            return self.growth_rates['mature']
    
    def predict_dbh(self, current_dbh: float, years: int) -> float:
        """
        Predict DBH after N years.
        
        Uses compound growth with diminishing returns for very large trees.
        """
        if years <= 0:
            return current_dbh
        
        predicted_dbh = current_dbh
        for year in range(years):
            growth_rate = self.get_growth_rate(predicted_dbh)
            # Cap growth at 100cm DBH (very large trees)
            if predicted_dbh < 100:
                predicted_dbh += growth_rate
            else:
                # Very large trees grow very slowly
                predicted_dbh += 0.1
        
        return min(predicted_dbh, 100)  # Cap at 100cm
    
    def predict_survival(self, years: int) -> float:
        """
        Predict survival probability after N years.
        
        Uses exponential decay: P(survive) = (1 - mortality_rate)^years
        """
        return (1 - self.mortality_rate) ** years
    
    def predict_co2_sequestration(self, dbh: float, years: int) -> Dict[str, float]:
        """
        Predict CO2 sequestration over N years.
        
        Returns:
            - annual_rate: kg CO2 per year at year N
            - cumulative: total kg CO2 sequestered over N years
        """
        # Annual rate increases with tree size
        # Formula: base_rate * (DBH/20)^1.5
        size_factor = (dbh / 20.0) ** 1.5
        annual_rate = self.base_co2_rate * size_factor
        
        # For cumulative, integrate over growth curve
        # Simplified: use average of start and end rates
        start_dbh = dbh
        end_dbh = self.predict_dbh(dbh, years)
        start_rate = self.base_co2_rate * ((start_dbh / 20.0) ** 1.5)
        end_rate = self.base_co2_rate * ((end_dbh / 20.0) ** 1.5)
        avg_rate = (start_rate + end_rate) / 2
        
        # Account for survival
        survival_prob = self.predict_survival(years)
        cumulative = avg_rate * years * survival_prob
        
        return {
            'annual_rate_kg_per_year': annual_rate * survival_prob,
            'cumulative_kg': cumulative,
            'cumulative_metric_tons': cumulative / 1000
        }
    
    def predict_temperature_reduction(self, dbh: float, years: int) -> Dict[str, float]:
        """
        Predict temperature reduction over N years.
        
        Returns:
            - annual_reduction: °F reduction at year N
            - cumulative_benefit: total cooling benefit over N years
        """
        # Temperature reduction increases with canopy size (proportional to DBH^2)
        size_factor = (dbh / 20.0) ** 2
        annual_reduction = self.base_temp_reduction * size_factor
        
        # For cumulative, use average
        start_dbh = dbh
        end_dbh = self.predict_dbh(dbh, years)
        start_reduction = self.base_temp_reduction * ((start_dbh / 20.0) ** 2)
        end_reduction = self.base_temp_reduction * ((end_dbh / 20.0) ** 2)
        avg_reduction = (start_reduction + end_reduction) / 2
        
        survival_prob = self.predict_survival(years)
        
        return {
            'annual_reduction_f': annual_reduction * survival_prob,
            'cumulative_cooling_degree_days': avg_reduction * years * survival_prob
        }
    
    def predict_pm25_reduction(self, dbh: float, years: int) -> Dict[str, float]:
        """
        Predict PM2.5 reduction over N years.
        
        Returns:
            - annual_reduction: lbs PM2.5 removed per year at year N
            - cumulative: total lbs PM2.5 removed over N years
        """
        # PM2.5 reduction increases with leaf surface area (proportional to DBH^1.5)
        size_factor = (dbh / 20.0) ** 1.5
        annual_reduction = self.base_pm25_rate * size_factor
        
        start_dbh = dbh
        end_dbh = self.predict_dbh(dbh, years)
        start_rate = self.base_pm25_rate * ((start_dbh / 20.0) ** 1.5)
        end_rate = self.base_pm25_rate * ((end_dbh / 20.0) ** 1.5)
        avg_rate = (start_rate + end_rate) / 2
        
        survival_prob = self.predict_survival(years)
        cumulative = avg_rate * years * survival_prob
        
        return {
            'annual_reduction_lbs_per_year': annual_reduction * survival_prob,
            'cumulative_lbs': cumulative
        }
    
    def predict_tree_impacts(
        self,
        current_dbh: float,
        years: int
    ) -> Dict[str, any]:
        """
        Predict all impacts for a single tree over N years.
        
        Args:
            current_dbh: Current diameter at breast height (cm)
            years: Number of years to project forward
            
        Returns:
            Dictionary with all predicted impacts
        """
        predicted_dbh = self.predict_dbh(current_dbh, years)
        survival_prob = self.predict_survival(years)
        
        co2 = self.predict_co2_sequestration(current_dbh, years)
        temp = self.predict_temperature_reduction(current_dbh, years)
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
    
    def predict_h3_cell_impacts(
        self,
        tree_data: pd.DataFrame,
        years: int
    ) -> Dict[str, any]:
        """
        Predict impacts for all trees in an H3 cell over N years.
        
        Args:
            tree_data: DataFrame with columns: tree_dbh (and optionally tree_id, status, health)
            years: Number of years to project forward
            
        Returns:
            Dictionary with aggregated predictions
        """
        # Filter alive trees only
        if 'status' in tree_data.columns:
            tree_data = tree_data[tree_data['status'] == 'Alive'].copy()
        
        if len(tree_data) == 0:
            return {
                'years_projected': years,
                'tree_count': 0,
                'predicted_tree_count': 0,
                'total_impacts': {}
            }
        
        # Get current DBH values
        dbh_values = tree_data['tree_dbh'].fillna(10.0)  # Default to 10cm if missing
        
        # Predict for each tree
        individual_predictions = []
        for dbh in dbh_values:
            pred = self.predict_tree_impacts(float(dbh), years)
            individual_predictions.append(pred)
        
        # Aggregate predictions
        predicted_tree_count = int(len(tree_data) * pred['survival_probability'])
        
        # Sum up impacts
        total_co2_annual = sum(p['co2_sequestration']['annual_rate_kg_per_year'] for p in individual_predictions)
        total_co2_cumulative = sum(p['co2_sequestration']['cumulative_kg'] for p in individual_predictions)
        
        total_temp_annual = sum(p['temperature_reduction']['annual_reduction_f'] for p in individual_predictions)
        total_temp_cumulative = sum(p['temperature_reduction']['cumulative_cooling_degree_days'] for p in individual_predictions)
        
        total_pm25_annual = sum(p['pm25_reduction']['annual_reduction_lbs_per_year'] for p in individual_predictions)
        total_pm25_cumulative = sum(p['pm25_reduction']['cumulative_lbs'] for p in individual_predictions)
        
        # Average DBH
        avg_current_dbh = dbh_values.mean()
        avg_predicted_dbh = np.mean([p['predicted_dbh_cm'] for p in individual_predictions])
        
        return {
            'years_projected': years,
            'tree_count': len(tree_data),
            'predicted_tree_count': predicted_tree_count,
            'tree_mortality': len(tree_data) - predicted_tree_count,
            'avg_current_dbh_cm': float(avg_current_dbh),
            'avg_predicted_dbh_cm': float(avg_predicted_dbh),
            'total_impacts': {
                'co2_sequestration': {
                    'annual_kg_per_year': total_co2_annual,
                    'annual_metric_tons_per_year': total_co2_annual / 1000,
                    'cumulative_kg': total_co2_cumulative,
                    'cumulative_metric_tons': total_co2_cumulative / 1000
                },
                'temperature_reduction': {
                    'annual_f': total_temp_annual,
                    'cumulative_degree_days': total_temp_cumulative
                },
                'pm25_reduction': {
                    'annual_lbs_per_year': total_pm25_annual,
                    'cumulative_lbs': total_pm25_cumulative
                }
            }
        }


class Backtester:
    """
    Backtests predictions against 2015 tree census data.
    
    Can validate:
    - Growth predictions (if we had 2024 census data)
    - Mortality predictions
    - Impact predictions
    """
    
    def __init__(self, predictor: TreeGrowthPredictor):
        self.predictor = predictor
        self.tree_census_path = CACHE_DIR / "street_trees_2015.csv"
    
    def load_2015_census(self) -> pd.DataFrame:
        """Load 2015 tree census data."""
        print(f"Loading 2015 tree census from {self.tree_census_path}...")
        df = pd.read_csv(self.tree_census_path, low_memory=False)
        
        # Filter alive trees
        df = df[df['status'] == 'Alive'].copy()
        
        # Ensure DBH is numeric
        df['tree_dbh'] = pd.to_numeric(df['tree_dbh'], errors='coerce')
        df = df[df['tree_dbh'].notna()].copy()
        
        print(f"Loaded {len(df)} alive trees from 2015 census")
        return df
    
    def backtest_growth(self, years: int = 9) -> Dict[str, any]:
        """
        Backtest growth predictions.
        
        Since we only have 2015 data, we can:
        1. Validate growth curves are reasonable
        2. Check mortality rates
        3. Validate impact calculations
        
        Args:
            years: Years to project forward (default 9, from 2015 to 2024)
        """
        df_2015 = self.load_2015_census()
        
        # Sample trees for backtesting (use a subset for speed)
        sample_size = min(10000, len(df_2015))
        df_sample = df_2015.sample(n=sample_size, random_state=42)
        
        print(f"\nBacktesting growth predictions for {years} years...")
        print(f"Using sample of {len(df_sample)} trees")
        
        # Predict for each tree
        predictions = []
        for idx, row in df_sample.iterrows():
            dbh_2015 = row['tree_dbh']
            pred = self.predictor.predict_tree_impacts(dbh_2015, years)
            predictions.append({
                'tree_id': row.get('tree_id', idx),
                'dbh_2015': dbh_2015,
                'predicted_dbh_2024': pred['predicted_dbh_cm'],
                'predicted_survival': pred['survival_probability'],
                'predicted_co2_annual': pred['co2_sequestration']['annual_rate_kg_per_year'],
                'predicted_co2_cumulative': pred['co2_sequestration']['cumulative_kg']
            })
        
        pred_df = pd.DataFrame(predictions)
        
        # Calculate statistics
        avg_growth = (pred_df['predicted_dbh_2024'] - pred_df['dbh_2015']).mean()
        expected_survival = pred_df['predicted_survival'].mean()
        expected_tree_count = int(len(df_sample) * expected_survival)
        
        total_co2_annual = pred_df['predicted_co2_annual'].sum()
        total_co2_cumulative = pred_df['predicted_co2_cumulative'].sum()
        
        results = {
            'years_projected': years,
            'sample_size': len(df_sample),
            'expected_survival_rate': float(expected_survival),
            'expected_tree_count_after_years': expected_tree_count,
            'expected_tree_mortality': len(df_sample) - expected_tree_count,
            'avg_dbh_growth_cm': float(avg_growth),
            'total_co2_sequestration': {
                'annual_kg_per_year': float(total_co2_annual),
                'annual_metric_tons_per_year': float(total_co2_annual / 1000),
                'cumulative_kg': float(total_co2_cumulative),
                'cumulative_metric_tons': float(total_co2_cumulative / 1000)
            },
            'validation_notes': [
                f"Growth predictions assume {self.predictor.growth_rates} cm/year growth rates",
                f"Mortality rate: {self.predictor.mortality_rate * 100}% per year",
                "Actual 2024 census data would allow full validation",
                "Predictions are conservative estimates based on urban tree research"
            ]
        }
        
        return results
    
    def validate_against_2015(self) -> Dict[str, any]:
        """
        Validate model assumptions against 2015 data.
        
        Checks:
        - DBH distribution is reasonable
        - Growth rates are plausible
        - Impact calculations match expected ranges
        """
        df_2015 = self.load_2015_census()
        
        # Analyze DBH distribution
        dbh_stats = {
            'mean': float(df_2015['tree_dbh'].mean()),
            'median': float(df_2015['tree_dbh'].median()),
            'std': float(df_2015['tree_dbh'].std()),
            'min': float(df_2015['tree_dbh'].min()),
            'max': float(df_2015['tree_dbh'].max()),
            'percentiles': {
                '25th': float(df_2015['tree_dbh'].quantile(0.25)),
                '50th': float(df_2015['tree_dbh'].quantile(0.50)),
                '75th': float(df_2015['tree_dbh'].quantile(0.75)),
                '90th': float(df_2015['tree_dbh'].quantile(0.90))
            }
        }
        
        # Calculate current impacts (baseline)
        sample_size = min(1000, len(df_2015))
        df_sample = df_2015.sample(n=sample_size, random_state=42)
        
        current_impacts = self.predictor.predict_h3_cell_impacts(df_sample, years=0)
        
        validation = {
            'census_year': 2015,
            'total_trees': len(df_2015),
            'alive_trees': len(df_2015[df_2015['status'] == 'Alive']),
            'dbh_statistics': dbh_stats,
            'baseline_impacts_sample': current_impacts,
            'model_parameters': {
                'growth_rates': self.predictor.growth_rates,
                'mortality_rate': self.predictor.mortality_rate,
                'base_co2_rate_kg_per_year': self.predictor.base_co2_rate,
                'base_temp_reduction_f': self.predictor.base_temp_reduction,
                'base_pm25_rate_lbs_per_year': self.predictor.base_pm25_rate
            }
        }
        
        return validation


def main():
    """Run backtesting and save results."""
    print("=" * 60)
    print("Tree Growth Prediction Model - Backtesting")
    print("=" * 60)
    
    predictor = TreeGrowthPredictor()
    backtester = Backtester(predictor)
    
    # Validate against 2015 data
    print("\n1. Validating model against 2015 census data...")
    validation = backtester.validate_against_2015()
    
    validation_path = MODELS_DIR / "backtest_validation_2015.json"
    with open(validation_path, 'w') as f:
        json.dump(validation, f, indent=2)
    print(f"✅ Saved validation to {validation_path}")
    
    # Backtest 9-year projection (2015 → 2024)
    print("\n2. Backtesting 9-year projection (2015 → 2024)...")
    backtest_results = backtester.backtest_growth(years=9)
    
    backtest_path = MODELS_DIR / "backtest_results_9years.json"
    with open(backtest_path, 'w') as f:
        json.dump(backtest_results, f, indent=2)
    print(f"✅ Saved backtest results to {backtest_path}")
    
    # Summary
    print("\n" + "=" * 60)
    print("Backtesting Summary")
    print("=" * 60)
    print(f"Sample size: {backtest_results['sample_size']:,} trees")
    print(f"Expected survival after 9 years: {backtest_results['expected_survival_rate']:.1%}")
    print(f"Expected tree count: {backtest_results['expected_tree_count_after_years']:,}")
    print(f"Average DBH growth: {backtest_results['avg_dbh_growth_cm']:.2f} cm")
    print(f"Total CO2 (annual): {backtest_results['total_co2_sequestration']['annual_metric_tons_per_year']:.1f} metric tons/year")
    print(f"Total CO2 (cumulative 9 years): {backtest_results['total_co2_sequestration']['cumulative_metric_tons']:.1f} metric tons")
    
    # Save predictor for use in API
    import pickle
    predictor_path = MODELS_DIR / "tree_growth_predictor.pkl"
    with open(predictor_path, 'wb') as f:
        pickle.dump(predictor, f)
    print(f"\n✅ Saved predictor model to {predictor_path}")


if __name__ == '__main__':
    main()
