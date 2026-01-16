"""
Example usage script for NYC UHI prediction system.

This script demonstrates how to use the system programmatically.
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from utils import load_config, setup_logger, create_h3_grid
from data import NYCDataDownloader, SpatialAggregator, Earth2Predictor
from utils.config_loader import get_cache_dir, get_output_dir, get_raw_data_dir


def example_create_h3_grid():
    """Example: Create H3 grid for NYC."""
    config = load_config()
    bbox = config["nyc_bbox"]
    
    logger = setup_logger()
    logger.info("Creating H3 grid...")
    
    h3_grid = create_h3_grid(
        min_lat=bbox["min_lat"],
        max_lat=bbox["max_lat"],
        min_lon=bbox["min_lon"],
        max_lon=bbox["max_lon"],
        resolution=config["h3"]["default_resolution"]
    )
    
    print(f"Created {len(h3_grid)} H3 hexagons")
    print(f"Sample hex ID: {h3_grid.iloc[0]['h3_id']}")
    
    return h3_grid


def example_download_data():
    """Example: Download NYC data."""
    config = load_config()
    raw_dir = get_raw_data_dir(config)
    
    logger = setup_logger()
    downloader = NYCDataDownloader(config, raw_dir)
    
    logger.info("Downloading tree census data...")
    try:
        tree_data = downloader.download_tree_census(force_download=False)
        print(f"Downloaded {len(tree_data)} tree records")
        return tree_data
    except Exception as e:
        print(f"Error downloading data: {e}")
        return None


def example_predict_temperature():
    """Example: Predict temperature for a specific hex."""
    config = load_config()
    
    logger = setup_logger()
    predictor = Earth2Predictor(config)
    
    # Example H3 hex ID (Manhattan area)
    hex_id = "892a1f3bfffffff"
    
    logger.info(f"Predicting temperature for hex: {hex_id}")
    predictions = predictor.predict_for_h3_hex(
        hex_id=hex_id,
        forecast_years=[1, 5, 10]
    )
    
    print(f"Generated {len(predictions)} predictions")
    print(predictions.head())
    
    return predictions


if __name__ == "__main__":
    print("=" * 60)
    print("NYC UHI Prediction System - Example Usage")
    print("=" * 60)
    
    print("\n1. Creating H3 grid...")
    h3_grid = example_create_h3_grid()
    
    print("\n2. Downloading data...")
    tree_data = example_download_data()
    
    print("\n3. Predicting temperature...")
    predictions = example_predict_temperature()
    
    print("\n" + "=" * 60)
    print("Examples completed!")
    print("=" * 60)
