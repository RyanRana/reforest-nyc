#!/usr/bin/env python3
"""
Generate JSON data for the interactive map.
Creates a file with hex data including temperature predictions, tree counts, etc.
"""

import json
import pandas as pd
import h3
from pathlib import Path
from utils import load_config, create_h3_grid
from data import Earth2Predictor
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_map_data(
    min_lat=40.4774,  # NYC southern tip (Staten Island)
    max_lat=40.9176,  # NYC northern tip (Bronx)
    min_lon=-74.2591,  # NYC western edge (Staten Island)
    max_lon=-73.7004,  # NYC eastern edge (Queens)
    resolution=9,
    output_file="map_data.json"
):
    """
    Generate data for interactive map.
    
    Args:
        min_lat, max_lat, min_lon, max_lon: Bounding box
        resolution: H3 resolution
        output_file: Output JSON file
    """
    logger.info("Generating map data...")
    
    # Create H3 grid
    logger.info(f"Creating H3 grid at resolution {resolution}")
    h3_grid_df = create_h3_grid(min_lat, max_lat, min_lon, max_lon, resolution)
    h3_grid = h3_grid_df['h3_id'].tolist() if 'h3_id' in h3_grid_df.columns else list(h3_grid_df)
    logger.info(f"Created {len(h3_grid)} hexagons")
    
    # Load configuration
    config = load_config()
    
    # Try to load cached tree stats
    cache_dir = Path("data/cache")
    tree_stats = None
    if (cache_dir / "tree_stats_aggregated.parquet").exists():
        logger.info("Loading tree statistics...")
        tree_stats = pd.read_parquet(cache_dir / "tree_stats_aggregated.parquet")
        logger.info(f"Loaded tree data for {len(tree_stats)} hexes")
    
    # Generate predictions for ALL hexes
    logger.info(f"Generating predictions for {len(h3_grid)} hexes...")
    
    predictor = Earth2Predictor(config)
    
    hex_data = []
    
    for i, hex_id in enumerate(h3_grid):
        if i % 100 == 0:
            logger.info(f"Processing hex {i+1}/{len(h3_grid)}")
        
        try:
            # Get hex properties
            lat, lon = h3.cell_to_latlng(hex_id)
            boundary = h3.cell_to_boundary(hex_id)
            hex_area = h3.cell_area(hex_id, unit="km^2")
            
            # Get tree count
            tree_count = 0
            if tree_stats is not None:
                tree_data = tree_stats[tree_stats["h3_id"] == hex_id]
                if not tree_data.empty:
                    tree_count = int(tree_data["tree_count"].iloc[0])
            
            # Get temperature prediction
            predictions = predictor.predict_for_h3_hex(hex_id, [1])
            avg_temp = predictions["temperature_c"].mean()
            
            # Calculate tree density
            tree_density = tree_count / hex_area if hex_area > 0 else 0
            
            hex_data.append({
                "hex_id": hex_id,
                "lat": float(lat),
                "lon": float(lon),
                "boundary": [[float(lat), float(lon)] for lat, lon in boundary],
                "hex_area_km2": float(hex_area),
                "tree_count": tree_count,
                "tree_density_km2": float(tree_density),
                "temperature_c": float(avg_temp),
                "temperature_f": float(avg_temp * 9/5 + 32)
            })
            
        except Exception as e:
            logger.error(f"Error processing hex {hex_id}: {e}")
            continue
    
    # Save to JSON
    output_path = Path(output_file)
    with open(output_path, 'w') as f:
        json.dump({
            "metadata": {
                "total_hexes": len(hex_data),
                "resolution": resolution,
                "bounds": {
                    "min_lat": min_lat,
                    "max_lat": max_lat,
                    "min_lon": min_lon,
                    "max_lon": max_lon
                }
            },
            "hexes": hex_data
        }, f, indent=2)
    
    logger.info(f"Saved map data to {output_path}")
    logger.info(f"Total hexes with data: {len(hex_data)}")
    
    return output_path


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate data for interactive map")
    parser.add_argument("--min_lat", type=float, default=40.4774, help="NYC southern tip")
    parser.add_argument("--max_lat", type=float, default=40.9176, help="NYC northern tip")
    parser.add_argument("--min_lon", type=float, default=-74.2591, help="NYC western edge")
    parser.add_argument("--max_lon", type=float, default=-73.7004, help="NYC eastern edge")
    parser.add_argument("--resolution", type=int, default=9, help="H3 resolution (8-10)")
    parser.add_argument("--output", type=str, default="map_data.json")
    
    args = parser.parse_args()
    
    generate_map_data(
        min_lat=args.min_lat,
        max_lat=args.max_lat,
        min_lon=args.min_lon,
        max_lon=args.max_lon,
        resolution=args.resolution,
        output_file=args.output
    )
