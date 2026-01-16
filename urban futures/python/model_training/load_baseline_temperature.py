"""
Load and analyze baseline temperature data from Central Park, NYC.

This data will be used to establish climate change trends for predictions.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json

BASE_DIR = Path(__file__).parent.parent.parent
ROOT_DIR = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = DATA_DIR / "models"


def load_baseline_temperature(csv_path: Path = None) -> pd.DataFrame:
    """Load baseline temperature data from CSV."""
    if csv_path is None:
        csv_path = DATA_DIR / "cache" / "baseline_temperature_central_park.csv"
    
    print(f"Loading baseline temperature data from {csv_path}...")
    
    # Read CSV, skipping comment lines
    df = pd.read_csv(csv_path, comment='#')
    
    # Parse date column (format: YYYYMM)
    df['year'] = df['Date'] // 100
    df['month'] = df['Date'] % 100
    
    # Filter for December (month 12)
    df = df[df['month'] == 12].copy()
    
    # Rename Value to temperature
    df['temperature_f'] = df['Value']
    
    print(f"  Loaded {len(df)} years of December temperature data")
    print(f"  Date range: {df['year'].min()} - {df['year'].max()}")
    print(f"  Temperature range: {df['temperature_f'].min():.1f}°F - {df['temperature_f'].max():.1f}°F")
    
    return df[['year', 'temperature_f']].sort_values('year')


def calculate_temperature_trend(df: pd.DataFrame) -> dict:
    """Calculate temperature trend over time."""
    # Linear regression to find warming trend
    years = df['year'].values
    temps = df['temperature_f'].values
    
    # Fit linear trend
    coeffs = np.polyfit(years, temps, 1)
    slope = coeffs[0]  # °F per year
    intercept = coeffs[1]
    
    # Calculate statistics
    mean_temp = temps.mean()
    std_temp = temps.std()
    
    # Recent trend (last 30 years)
    recent_df = df[df['year'] >= df['year'].max() - 30]
    recent_coeffs = np.polyfit(recent_df['year'].values, recent_df['temperature_f'].values, 1)
    recent_slope = recent_coeffs[0]
    
    # Baseline for predictions (average of last 10 years)
    baseline_years = df[df['year'] >= df['year'].max() - 10]
    baseline_temp = baseline_years['temperature_f'].mean()
    
    trend = {
        'long_term_slope_f_per_year': float(slope),
        'recent_slope_f_per_year': float(recent_slope),
        'mean_temperature_f': float(mean_temp),
        'std_temperature_f': float(std_temp),
        'baseline_temperature_f': float(baseline_temp),
        'baseline_year': int(baseline_years['year'].max()),
        'data_range': {
            'start_year': int(years.min()),
            'end_year': int(years.max()),
            'n_years': len(df)
        }
    }
    
    return trend


def project_temperature(year: int, baseline_year: int, baseline_temp: float, 
                       warming_rate: float) -> float:
    """
    Project temperature for a given year based on baseline.
    
    Args:
        year: Target year
        baseline_year: Baseline year (e.g., 2024)
        baseline_temp: Baseline temperature in °F
        warming_rate: Warming rate in °F per year
    
    Returns:
        Projected temperature in °F
    """
    years_ahead = year - baseline_year
    return baseline_temp + (warming_rate * years_ahead)


def main():
    """Load baseline data and save trend analysis."""
    print("=" * 60)
    print("Baseline Temperature Analysis")
    print("=" * 60)
    
    # Load data
    df = load_baseline_temperature()
    
    # Calculate trend
    trend = calculate_temperature_trend(df)
    
    # Print results
    print("\n" + "=" * 60)
    print("Temperature Trend Analysis")
    print("=" * 60)
    print(f"Long-term warming rate: {trend['long_term_slope_f_per_year']:.4f}°F/year")
    print(f"Recent warming rate (last 30 years): {trend['recent_slope_f_per_year']:.4f}°F/year")
    print(f"Mean temperature: {trend['mean_temperature_f']:.1f}°F")
    print(f"Baseline temperature ({trend['baseline_year']}): {trend['baseline_temperature_f']:.1f}°F")
    
    # Project future temperatures
    print("\n" + "=" * 60)
    print("Temperature Projections")
    print("=" * 60)
    baseline_year = trend['baseline_year']
    baseline_temp = trend['baseline_temperature_f']
    warming_rate = trend['recent_slope_f_per_year']  # Use recent trend
    
    for years_ahead in [1, 5, 10, 20, 30]:
        projected_year = baseline_year + years_ahead
        projected_temp = project_temperature(
            projected_year, baseline_year, baseline_temp, warming_rate
        )
        print(f"{projected_year}: {projected_temp:.1f}°F (+{projected_temp - baseline_temp:.1f}°F)")
    
    # Save trend data
    trend_path = MODELS_DIR / "baseline_temperature_trend.json"
    with open(trend_path, 'w') as f:
        json.dump(trend, f, indent=2)
    print(f"\n✅ Saved trend data to {trend_path}")
    
    return trend


if __name__ == '__main__':
    main()
