#!/usr/bin/env python3
"""
Main CLI entry point for NYC UHI prediction system.

Usage:
    python main.py --h3_id 892a1f3bfffffff --years 1 5 10
    python main.py --all --years 1 5 10
"""

import argparse
import sys
from pathlib import Path
from typing import List, Optional
import logging
import pandas as pd

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from utils import load_config, setup_logger, create_h3_grid, validate_h3_id
from data import NYCDataDownloader, SpatialAggregator, Earth2Predictor
from utils.visualization import visualize_predictions


def main():
    """Main CLI function."""
    parser = argparse.ArgumentParser(
        description="NYC Urban Heat Island Prediction System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Predict for specific H3 hex
  python main.py --h3_id 892a1f3bfffffff --years 1 5 10
  
  # Predict for all hexes in NYC
  python main.py --all --years 1 5 10
  
  # Process data only (no predictions)
  python main.py --process-data
        """
    )
    
    parser.add_argument(
        "--h3_id",
        type=str,
        help="H3 hexagon ID to predict for"
    )
    
    parser.add_argument(
        "--all",
        action="store_true",
        help="Process all H3 hexagons in NYC bounding box"
    )
    
    parser.add_argument(
        "--years",
        type=int,
        nargs="+",
        default=[1, 5, 10],
        help="Forecast horizons in years (default: 1 5 10)"
    )
    
    parser.add_argument(
        "--process-data",
        action="store_true",
        help="Only process data, don't run predictions"
    )
    
    parser.add_argument(
        "--config",
        type=str,
        default="config.yaml",
        help="Path to configuration file (default: config.yaml)"
    )
    
    parser.add_argument(
        "--force-download",
        action="store_true",
        help="Force re-download of data (ignore cache)"
    )
    
    parser.add_argument(
        "--visualize",
        action="store_true",
        help="Generate visualization maps"
    )
    
    args = parser.parse_args()
    
    # Load configuration
    try:
        config = load_config(args.config)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Setup logging
    log_config = config.get("logging", {})
    logger = setup_logger(
        name="uhi_prediction",
        log_level=log_config.get("level", "INFO"),
        log_file=log_config.get("file"),
        log_format=log_config.get("format")
    )
    
    logger.info("Starting NYC UHI prediction system")
    
    # Get directories
    from utils.config_loader import get_cache_dir, get_output_dir, get_raw_data_dir
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
    
    # Cache H3 grid
    h3_grid_file = cache_dir / "h3_grid.parquet"
    h3_grid.to_parquet(h3_grid_file, compression="snappy")
    logger.info(f"Cached H3 grid to {h3_grid_file}")
    
    # Initialize data downloader and aggregator
    downloader = NYCDataDownloader(config, raw_dir)
    aggregator = SpatialAggregator(config, cache_dir)
    
    # Process data
    logger.info("Processing NYC data...")
    
    # Download tree census
    try:
        tree_data = downloader.download_tree_census(force_download=args.force_download)
        logger.info(f"Downloaded {len(tree_data)} tree records")
    except Exception as e:
        logger.error(f"Error downloading tree census: {e}")
        tree_data = None
    
    # Download temperature data (placeholder)
    try:
        temp_data = downloader.download_noaa_temperature(
            station_id=config["data_sources"]["noaa"]["central_park_station"],
            start_date="2015-01-01",
            end_date="2024-12-31",
            force_download=args.force_download
        )
        logger.info(f"Downloaded temperature data: {len(temp_data)} records")
    except Exception as e:
        logger.error(f"Error downloading temperature data: {e}")
        temp_data = None
    
    # Download NDVI data (optional)
    try:
        ndvi_data = downloader.download_ndvi_data(
            start_date="2015-01-01",
            end_date="2024-12-31",
            force_download=args.force_download
        )
        if ndvi_data is not None:
            logger.info(f"Downloaded NDVI data: {len(ndvi_data)} records")
    except Exception as e:
        logger.warning(f"NDVI data not available: {e}")
        ndvi_data = None
    
    # Aggregate spatial data
    logger.info("Aggregating spatial data per H3 hexagon...")
    
    tree_stats = pd.DataFrame()
    if tree_data is not None:
        tree_stats = aggregator.aggregate_trees_per_hex(h3_grid, tree_data)
        tree_stats_file = cache_dir / "tree_stats.parquet"
        tree_stats.to_parquet(tree_stats_file, compression="snappy")
        logger.info(f"Cached tree statistics to {tree_stats_file}")
    
    green_stats = pd.DataFrame()
    if ndvi_data is not None:
        green_stats = aggregator.aggregate_green_space_per_hex(h3_grid, ndvi_data)
        green_stats_file = cache_dir / "green_stats.parquet"
        green_stats.to_parquet(green_stats_file, compression="snappy")
        logger.info(f"Cached green space statistics to {green_stats_file}")
    
    temp_stats = pd.DataFrame()
    if temp_data is not None:
        temp_stats = aggregator.aggregate_temperature_per_hex(h3_grid, temp_data)
        temp_stats_file = cache_dir / "temp_stats.parquet"
        temp_stats.to_parquet(temp_stats_file, compression="snappy")
        logger.info(f"Cached temperature statistics to {temp_stats_file}")
    
    # Create feature DataFrame
    import pandas as pd
    features = aggregator.create_feature_dataframe(
        h3_grid,
        tree_stats,
        green_stats,
        temp_stats
    )
    
    features_file = output_dir / "features.parquet"
    features.to_parquet(features_file, compression="snappy")
    logger.info(f"Saved feature DataFrame to {features_file}")
    
    if args.process_data:
        logger.info("Data processing complete. Exiting.")
        return
    
    # Run predictions
    logger.info("Initializing Earth-2 predictor...")
    predictor = Earth2Predictor(config)
    
    # Determine which hexes to predict for
    if args.h3_id:
        if not validate_h3_id(args.h3_id):
            logger.error(f"Invalid H3 ID: {args.h3_id}")
            sys.exit(1)
        hex_ids = [args.h3_id]
    elif args.all:
        hex_ids = h3_grid["h3_id"].tolist()
        logger.info(f"Processing predictions for {len(hex_ids)} hexagons")
    else:
        logger.error("Must specify either --h3_id or --all")
        sys.exit(1)
    
    # Run predictions
    all_predictions = []
    for hex_id in hex_ids:
        logger.info(f"Predicting for H3 hex: {hex_id}")
        predictions = predictor.predict_for_h3_hex(
            hex_id=hex_id,
            forecast_years=args.years,
            initial_date=None  # Use current date
        )
        predictions["h3_id"] = hex_id
        all_predictions.append(predictions)
    
    # Combine predictions
    if all_predictions:
        combined_predictions = pd.concat(all_predictions, ignore_index=True)
        predictions_file = output_dir / "predictions.parquet"
        combined_predictions.to_parquet(predictions_file, compression="snappy")
        logger.info(f"Saved predictions to {predictions_file}")
        
        # Generate visualization if requested
        if args.visualize:
            logger.info("Generating visualization maps...")
            visualize_predictions(
                combined_predictions,
                h3_grid,
                output_file=str(output_dir / "predictions_map.html")
            )
            logger.info(f"Visualization saved to {output_dir / 'predictions_map.html'}")
    else:
        logger.warning("No predictions generated")
    
    logger.info("NYC UHI prediction system completed successfully")


if __name__ == "__main__":
    main()
