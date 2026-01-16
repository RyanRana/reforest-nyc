#!/usr/bin/env python3
"""
CLI tool to predict temperature change when adding trees to H3 hexagons.

Usage:
    python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 50
    python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 100 --use_cached_predictions
"""

import argparse
import pandas as pd
import logging
from pathlib import Path
from typing import List
import sys

from utils import load_config, setup_logger
from utils.config_loader import get_output_dir, get_cache_dir
from models import TreeMitigationModel
from data import Earth2Predictor, NYCDataDownloader, SpatialAggregator


def main():
    parser = argparse.ArgumentParser(
        description="Predict temperature change when adding trees to H3 hexagons"
    )
    parser.add_argument(
        "--h3_id",
        type=str,
        help="Single H3 hexagon ID"
    )
    parser.add_argument(
        "--h3_ids",
        type=str,
        nargs="+",
        help="Multiple H3 hexagon IDs"
    )
    parser.add_argument(
        "--add_trees",
        type=int,
        required=True,
        help="Number of trees to add to each hex"
    )
    parser.add_argument(
        "--use_cached_predictions",
        action="store_true",
        help="Use cached Earth-2 predictions if available"
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
        help="Output file path (CSV or JSON)"
    )
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    
    # Setup logging
    logger = setup_logger(
        "add_trees_cli",
        log_level=config.get("logging", {}).get("level", "INFO")
    )
    
    # Get hex IDs
    if args.h3_id:
        hex_ids = [args.h3_id]
    elif args.h3_ids:
        hex_ids = args.h3_ids
    else:
        logger.error("Must provide either --h3_id or --h3_ids")
        sys.exit(1)
    
    logger.info(f"Analyzing {len(hex_ids)} hex cell(s) with +{args.add_trees} trees")
    
    # Setup directories
    output_dir = Path(get_output_dir(config))
    cache_dir = Path(get_cache_dir(config))
    output_dir.mkdir(parents=True, exist_ok=True)
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    # Load or generate Earth-2 predictions
    predictions_file = cache_dir / "earth2_predictions.parquet"
    
    if args.use_cached_predictions and predictions_file.exists():
        logger.info(f"Loading cached Earth-2 predictions from {predictions_file}")
        earth2_predictions = pd.read_parquet(predictions_file)
    else:
        logger.info("Generating Earth-2 predictions...")
        predictor = Earth2Predictor(config)
        
        # Generate predictions for all hex IDs
        all_predictions = []
        for hex_id in hex_ids:
            logger.info(f"Predicting for hex {hex_id}")
            try:
                preds = predictor.predict_for_h3_hex(
                    hex_id,
                    forecast_years=[1, 5, 10]
                )
                all_predictions.append(preds)
            except Exception as e:
                logger.error(f"Error predicting for hex {hex_id}: {e}")
        
        if not all_predictions:
            logger.error("No predictions generated")
            sys.exit(1)
        
        earth2_predictions = pd.concat(all_predictions, ignore_index=True)
        
        # Cache predictions
        earth2_predictions.to_parquet(predictions_file)
        logger.info(f"Cached predictions to {predictions_file}")
    
    # Load tree statistics
    tree_stats = None
    tree_stats_file = cache_dir / "tree_stats_aggregated.parquet"
    
    if tree_stats_file.exists():
        logger.info(f"Loading tree statistics from {tree_stats_file}")
        tree_stats = pd.read_parquet(tree_stats_file)
    else:
        logger.info("Tree statistics not found, will use 0 as baseline")
        logger.info("Run main.py first to generate tree statistics")
    
    # Initialize mitigation model
    mitigation_model = TreeMitigationModel(config)
    
    # Analyze each hex
    results = []
    
    print("\n" + "="*80)
    print(f"TEMPERATURE PREDICTION: Adding {args.add_trees} trees per hex")
    print("="*80 + "\n")
    
    for hex_id in hex_ids:
        result = mitigation_model.predict_temperature_with_trees(
            hex_id=hex_id,
            additional_trees=args.add_trees,
            earth2_predictions=earth2_predictions,
            tree_stats=tree_stats
        )
        
        if not result.get("success", False):
            logger.warning(f"Failed to analyze hex {hex_id}: {result.get('error', 'Unknown error')}")
            continue
        
        results.append(result)
        
        # Print formatted results
        print(f"Hex ID: {hex_id}")
        print(f"  Location: ({result['lat']:.4f}, {result['lon']:.4f})")
        print(f"  Area: {result['hex_area_km2']:.4f} km²")
        print()
        print(f"  Current State:")
        print(f"    • Trees: {result['current_tree_count']:,}")
        print(f"    • Tree Density: {result['current_tree_density_km2']:.1f} trees/km²")
        print(f"    • Temperature: {result['current_temp_c']:.2f}°C")
        print()
        print(f"  After Adding {args.add_trees} Trees:")
        print(f"    • Total Trees: {result['new_tree_count']:,}")
        print(f"    • Tree Density: {result['new_tree_density_km2']:.1f} trees/km²")
        print(f"    • Temperature: {result['new_temp_c']:.2f}°C")
        print()
        print(f"  Temperature Change:")
        print(f"    • Additional Cooling: {result['additional_reduction_c']:.3f}°C")
        print(f"    • Total Cooling: {result['total_reduction_c']:.3f}°C")
        print(f"    • Net Change: {result['temp_change_c']:.3f}°C")
        print()
        print(f"  Earth-2 Baseline: {result['baseline_temp_c']:.2f}°C (before any tree effects)")
        print("-"*80 + "\n")
    
    # Save results
    if results:
        results_df = pd.DataFrame(results)
        
        if args.output:
            output_path = Path(args.output)
        else:
            output_path = output_dir / f"add_trees_{args.add_trees}_results.csv"
        
        if output_path.suffix == ".json":
            results_df.to_json(output_path, orient="records", indent=2)
        else:
            results_df.to_csv(output_path, index=False)
        
        logger.info(f"Results saved to {output_path}")
        
        # Print summary statistics
        print("="*80)
        print("SUMMARY STATISTICS")
        print("="*80)
        print(f"Hexes Analyzed: {len(results)}")
        print(f"Trees Added Per Hex: {args.add_trees}")
        print(f"Total Trees Added: {args.add_trees * len(results):,}")
        print()
        print(f"Temperature Changes:")
        print(f"  • Average Cooling: {results_df['additional_reduction_c'].mean():.3f}°C")
        print(f"  • Minimum Cooling: {results_df['additional_reduction_c'].min():.3f}°C")
        print(f"  • Maximum Cooling: {results_df['additional_reduction_c'].max():.3f}°C")
        print(f"  • Median Cooling: {results_df['additional_reduction_c'].median():.3f}°C")
        print()
        print(f"New Average Temperature: {results_df['new_temp_c'].mean():.2f}°C")
        print(f"(vs Current: {results_df['current_temp_c'].mean():.2f}°C)")
        print("="*80)
    else:
        logger.error("No results to save")
        sys.exit(1)


if __name__ == "__main__":
    main()
