#!/usr/bin/env python3
"""
CLI tool for tree mitigation analysis.

Calculates how many trees are needed to achieve target temperature reduction
for H3 hexagons using Earth-2 predictions.
"""

import argparse
import sys
from pathlib import Path
import pandas as pd
import logging

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from utils import load_config, setup_logger, validate_h3_id
from data import NYCDataDownloader, SpatialAggregator, Earth2Predictor
from models import TreeMitigationModel
from utils.config_loader import get_cache_dir, get_output_dir, get_raw_data_dir


def main():
    """Main CLI function for tree mitigation analysis."""
    parser = argparse.ArgumentParser(
        description="Tree Mitigation Analysis - Calculate trees needed for temperature reduction",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Analyze single hex with 2°C target reduction
  python tree_mitigation_cli.py --h3_id 892a10726d7ffff --target_reduction 2.0
  
  # Analyze multiple hexes
  python tree_mitigation_cli.py --h3_ids 892a10726d7ffff 892a10731b3ffff --target_reduction 1.5
  
  # Use existing predictions
  python tree_mitigation_cli.py --h3_id 892a10726d7ffff --target_reduction 2.0 --use_cached_predictions
        """
    )
    
    parser.add_argument(
        "--h3_id",
        type=str,
        help="Single H3 hexagon ID to analyze"
    )
    
    parser.add_argument(
        "--h3_ids",
        type=str,
        nargs="+",
        help="Multiple H3 hexagon IDs to analyze"
    )
    
    parser.add_argument(
        "--target_reduction",
        type=float,
        required=True,
        help="Target temperature reduction in °C"
    )
    
    parser.add_argument(
        "--use_cached_predictions",
        action="store_true",
        help="Use cached Earth-2 predictions instead of generating new ones"
    )
    
    parser.add_argument(
        "--config",
        type=str,
        default="config.yaml",
        help="Path to configuration file"
    )
    
    parser.add_argument(
        "--output",
        type=str,
        help="Output file path for results (CSV or JSON)"
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
        name="tree_mitigation",
        log_level=log_config.get("level", "INFO"),
        log_file=None,  # Don't create separate log file for CLI
        log_format=log_config.get("format")
    )
    
    logger.info("Starting tree mitigation analysis")
    
    # Get hex IDs
    hex_ids = []
    if args.h3_id:
        if not validate_h3_id(args.h3_id):
            logger.error(f"Invalid H3 ID: {args.h3_id}")
            sys.exit(1)
        hex_ids = [args.h3_id]
    elif args.h3_ids:
        for hex_id in args.h3_ids:
            if not validate_h3_id(hex_id):
                logger.error(f"Invalid H3 ID: {hex_id}")
                sys.exit(1)
        hex_ids = args.h3_ids
    else:
        logger.error("Must specify either --h3_id or --h3_ids")
        sys.exit(1)
    
    # Get directories
    cache_dir = get_cache_dir(config)
    output_dir = get_output_dir(config)
    raw_dir = get_raw_data_dir(config)
    
    # Load or generate Earth-2 predictions
    predictions_file = output_dir / "predictions_10_cells.parquet"
    
    if args.use_cached_predictions and predictions_file.exists():
        logger.info(f"Loading cached predictions from {predictions_file}")
        earth2_predictions = pd.read_parquet(predictions_file)
    else:
        logger.info("Generating Earth-2 predictions...")
        predictor = Earth2Predictor(config)
        
        all_predictions = []
        for hex_id in hex_ids:
            logger.info(f"Predicting for hex: {hex_id}")
            predictions = predictor.predict_for_h3_hex(
                hex_id=hex_id,
                forecast_years=[1, 5, 10],
                initial_date=None
            )
            predictions["h3_id"] = hex_id
            all_predictions.append(predictions)
        
        earth2_predictions = pd.concat(all_predictions, ignore_index=True)
        logger.info(f"Generated {len(earth2_predictions)} predictions")
    
    # Load tree statistics
    tree_stats_file = cache_dir / "tree_stats.parquet"
    tree_stats = None
    if tree_stats_file.exists():
        logger.info(f"Loading tree statistics from {tree_stats_file}")
        tree_stats = pd.read_parquet(tree_stats_file)
    else:
        logger.warning("Tree statistics not found. Will use 0 trees for all hexes.")
        # Try to load tree data and aggregate
        try:
            downloader = NYCDataDownloader(config, raw_dir)
            from utils import create_h3_grid
            bbox = config["nyc_bbox"]
            h3_grid = create_h3_grid(
                min_lat=bbox["min_lat"],
                max_lat=bbox["max_lat"],
                min_lon=bbox["min_lon"],
                max_lon=bbox["max_lon"],
                resolution=config["h3"]["default_resolution"]
            )
            tree_data = downloader.download_tree_census(force_download=False)
            aggregator = SpatialAggregator(config, cache_dir)
            tree_stats = aggregator.aggregate_trees_per_hex(h3_grid, tree_data)
        except Exception as e:
            logger.warning(f"Could not load tree data: {e}")
            tree_stats = None
    
    # Initialize mitigation model
    mitigation_model = TreeMitigationModel(config)
    
    # Analyze each hex
    results = []
    for hex_id in hex_ids:
        logger.info(f"Analyzing hex {hex_id} for {args.target_reduction}°C reduction...")
        
        result = mitigation_model.analyze_hex_with_earth2(
            hex_id=hex_id,
            target_reduction=args.target_reduction,
            earth2_predictions=earth2_predictions,
            tree_stats=tree_stats
        )
        
        results.append(result)
        
        # Print summary
        print(f"\n{'='*60}")
        print(f"Analysis for H3 Hex: {hex_id}")
        print(f"{'='*60}")
        lat = result.get('lat', 'N/A')
        lon = result.get('lon', 'N/A')
        if lat != 'N/A' and lon != 'N/A':
            print(f"Location: ({lat:.4f}, {lon:.4f})")
        else:
            print(f"Location: N/A")
        hex_area = result.get('hex_area_km2', 'N/A')
        if hex_area != 'N/A':
            print(f"Hex Area: {hex_area:.4f} km²")
        else:
            print(f"Hex Area: N/A")
        print(f"Current Temperature: {result.get('current_temperature_c', 'N/A'):.2f}°C")
        print(f"Current Tree Count: {result.get('current_tree_count', 0)}")
        print(f"Current Temperature Reduction: {result.get('current_reduction', 0):.2f}°C")
        print(f"\nTarget Reduction: {args.target_reduction}°C")
        print(f"Trees Needed: {result.get('trees_needed', 'N/A')}")
        print(f"Total Trees Required: {result.get('total_trees_needed', 'N/A')}")
        print(f"Feasible: {result.get('feasible', False)}")
        print(f"Message: {result.get('message', 'N/A')}")
        if 'predicted_reduction' in result:
            print(f"Predicted Reduction: {result.get('predicted_reduction', 0):.2f}°C")
        print(f"{'='*60}\n")
    
    # Save results
    results_df = pd.DataFrame(results)
    
    if args.output:
        output_path = Path(args.output)
        if output_path.suffix == '.json':
            results_df.to_json(output_path, orient='records', indent=2)
        else:
            results_df.to_csv(output_path, index=False)
        logger.info(f"Results saved to {output_path}")
    else:
        # Default output
        default_output = output_dir / f"tree_mitigation_analysis_{args.target_reduction}c.csv"
        results_df.to_csv(default_output, index=False)
        logger.info(f"Results saved to {default_output}")
    
    logger.info("Tree mitigation analysis completed")


if __name__ == "__main__":
    main()
