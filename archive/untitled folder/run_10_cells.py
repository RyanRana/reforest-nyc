#!/usr/bin/env python3
"""Run predictions for 10 H3 cells."""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from utils import load_config, setup_logger, create_h3_grid
from data import NYCDataDownloader, SpatialAggregator, Earth2Predictor
from utils.config_loader import get_cache_dir, get_output_dir, get_raw_data_dir
import pandas as pd
import logging

def main():
    """Run predictions for 10 H3 cells."""
    # Load configuration
    config = load_config()
    
    # Setup logging
    log_config = config.get("logging", {})
    logger = setup_logger(
        name="uhi_prediction",
        log_level=log_config.get("level", "INFO"),
        log_file=log_config.get("file"),
        log_format=log_config.get("format")
    )
    
    logger.info("Starting predictions for 10 H3 cells")
    
    # Get directories
    cache_dir = get_cache_dir(config)
    output_dir = get_output_dir(config)
    raw_dir = get_raw_data_dir(config)
    
    # Create H3 grid
    bbox = config["nyc_bbox"]
    h3_resolution = config["h3"]["default_resolution"]
    
    logger.info("Creating H3 grid...")
    h3_grid = create_h3_grid(
        min_lat=bbox["min_lat"],
        max_lat=bbox["max_lat"],
        min_lon=bbox["min_lon"],
        max_lon=bbox["max_lon"],
        resolution=h3_resolution
    )
    
    # Select 10 cells (first 10 in the grid)
    selected_hexes = h3_grid.head(10)["h3_id"].tolist()
    logger.info(f"Selected 10 H3 hexagons: {selected_hexes}")
    
    # Initialize data downloader and aggregator
    downloader = NYCDataDownloader(config, raw_dir)
    aggregator = SpatialAggregator(config, cache_dir)
    
    # Process tree data
    logger.info("Loading tree census data...")
    try:
        tree_data = downloader.download_tree_census(force_download=False)
        logger.info(f"Loaded {len(tree_data)} tree records")
        
        # Aggregate tree data
        tree_stats = aggregator.aggregate_trees_per_hex(h3_grid, tree_data)
        logger.info(f"Aggregated tree data for {len(tree_stats)} hexagons")
    except Exception as e:
        logger.warning(f"Error processing tree data: {e}")
        tree_stats = pd.DataFrame()
    
    # Initialize Earth-2 predictor
    logger.info("Initializing Earth-2 predictor...")
    predictor = Earth2Predictor(config)
    
    # Run predictions for 10 cells
    logger.info("Running predictions for 10 H3 cells...")
    all_predictions = []
    
    for i, hex_id in enumerate(selected_hexes, 1):
        logger.info(f"[{i}/10] Predicting for H3 hex: {hex_id}")
        try:
            predictions = predictor.predict_for_h3_hex(
                hex_id=hex_id,
                forecast_years=[1, 5, 10],
                initial_date=None
            )
            predictions["h3_id"] = hex_id
            all_predictions.append(predictions)
            logger.info(f"Generated {len(predictions)} predictions for {hex_id}")
        except Exception as e:
            logger.error(f"Error predicting for {hex_id}: {e}")
    
    # Combine predictions
    if all_predictions:
        combined_predictions = pd.concat(all_predictions, ignore_index=True)
        predictions_file = output_dir / "predictions_10_cells.parquet"
        combined_predictions.to_parquet(predictions_file, compression="snappy")
        logger.info(f"Saved predictions to {predictions_file}")
        
        # Save summary
        summary = combined_predictions.groupby(["h3_id", "forecast_horizon_years"]).agg({
            "temperature_c": ["mean", "min", "max", "std"]
        }).round(2)
        summary_file = output_dir / "predictions_10_cells_summary.csv"
        summary.to_csv(summary_file)
        logger.info(f"Saved summary to {summary_file}")
        
        # Print summary
        print("\n" + "="*60)
        print("PREDICTION SUMMARY (10 H3 Cells)")
        print("="*60)
        print(f"\nTotal predictions: {len(combined_predictions)}")
        print(f"\nAverage temperature by forecast horizon:")
        for years in [1, 5, 10]:
            subset = combined_predictions[combined_predictions["forecast_horizon_years"] == years]
            avg_temp = subset["temperature_c"].mean()
            print(f"  {years} year(s): {avg_temp:.2f}°C ({avg_temp*9/5+32:.2f}°F)")
        
        print(f"\nPredictions saved to: {predictions_file}")
        print(f"Summary saved to: {summary_file}")
        print("="*60)
    else:
        logger.error("No predictions generated")
    
    logger.info("Completed predictions for 10 H3 cells")

if __name__ == "__main__":
    main()
