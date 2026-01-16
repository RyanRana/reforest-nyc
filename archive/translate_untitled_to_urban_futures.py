#!/usr/bin/env python3
"""
Translate untitled folder results to urban futures format.

This script:
1. Loads temperature predictions from untitled folder
2. Merges them with urban futures H3 features
3. Updates priority scores to include temperature data
4. Saves updated features for use in urban futures
"""
import pandas as pd
import numpy as np
from pathlib import Path
import sys

def translate_untitled_to_urban_futures(
    untitled_results_path=None,
    urban_futures_features_path=None,
    output_path=None
):
    """
    Translate untitled folder results to urban futures format.
    
    Args:
        untitled_results_path: Path to untitled folder results CSV
        urban_futures_features_path: Path to urban futures H3 features parquet
        output_path: Path to save updated features
    """
    # Set default paths
    base_dir = Path(__file__).parent
    
    if untitled_results_path is None:
        untitled_results_path = base_dir / "untitled folder" / "data" / "processed" / "FINAL_REAL_RESULTS.csv"
    
    if urban_futures_features_path is None:
        urban_futures_features_path = base_dir / "urban futures" / "data" / "models" / "h3_features.parquet"
    
    if output_path is None:
        output_path = base_dir / "urban futures" / "data" / "models" / "h3_features_with_temp.parquet"
    
    print("=" * 60)
    print("Translating Untitled Folder → Urban Futures")
    print("=" * 60)
    
    # Load untitled folder results
    print(f"\n1. Loading untitled folder results from: {untitled_results_path}")
    if not untitled_results_path.exists():
        print(f"   ❌ Error: File not found: {untitled_results_path}")
        return None
    
    try:
        untitled_data = pd.read_csv(untitled_results_path)
        print(f"   ✅ Loaded {len(untitled_data)} records")
    except Exception as e:
        print(f"   ❌ Error loading file: {e}")
        return None
    
    # Load urban futures features
    print(f"\n2. Loading urban futures features from: {urban_futures_features_path}")
    if not urban_futures_features_path.exists():
        print(f"   ❌ Error: File not found: {urban_futures_features_path}")
        return None
    
    try:
        urban_futures_data = pd.read_parquet(urban_futures_features_path)
        print(f"   ✅ Loaded {len(urban_futures_data)} H3 cells")
    except Exception as e:
        print(f"   ❌ Error loading file: {e}")
        return None
    
    # Extract and prepare temperature data
    print(f"\n3. Extracting temperature data from untitled folder results...")
    
    # Get unique hex_id and aggregate (in case of multiple target_reduction rows)
    temp_data = untitled_data.groupby('hex_id').agg({
        'current_temperature_c': 'mean',
        'current_reduction': 'mean',
        'current_tree_count': 'first',
        'lat': 'first',
        'lon': 'first'
    }).reset_index()
    
    # Rename columns to match urban futures format
    temp_data = temp_data.rename(columns={
        'hex_id': 'h3_cell',
        'current_temperature_c': 'earth2_temp_c',
        'current_reduction': 'tree_cooling_c',
        'current_tree_count': 'earth2_tree_count'
    })
    
    print(f"   ✅ Extracted temperature data for {len(temp_data)} unique hexes")
    
    # Merge with urban futures features
    print(f"\n4. Merging temperature data with urban futures features...")
    
    # Ensure h3_cell is string in both
    temp_data['h3_cell'] = temp_data['h3_cell'].astype(str)
    urban_futures_data['h3_cell'] = urban_futures_data['h3_cell'].astype(str)
    
    merged = urban_futures_data.merge(
        temp_data[['h3_cell', 'earth2_temp_c', 'tree_cooling_c', 'earth2_tree_count']],
        on='h3_cell',
        how='left'
    )
    
    matched_count = merged['earth2_temp_c'].notna().sum()
    print(f"   ✅ Matched {matched_count} / {len(urban_futures_data)} H3 cells")
    
    # Add temperature-based priority adjustment
    print(f"\n5. Computing temperature-based priority adjustments...")
    
    # Normalize temperature (higher temp = higher priority)
    if merged['earth2_temp_c'].notna().any():
        temp_min = merged['earth2_temp_c'].min()
        temp_max = merged['earth2_temp_c'].max()
        temp_range = temp_max - temp_min
        
        if temp_range > 0:
            merged['temp_priority'] = (
                (merged['earth2_temp_c'] - temp_min) / temp_range
            ).fillna(0.5)
        else:
            merged['temp_priority'] = 0.5
    else:
        merged['temp_priority'] = 0.5
    
    # Update priority_final to include temperature (20% weight)
    # Only update cells that have temperature data
    has_temp = merged['earth2_temp_c'].notna()
    merged.loc[has_temp, 'priority_final'] = (
        merged.loc[has_temp, 'priority_final'] * 
        (1 + 0.2 * merged.loc[has_temp, 'temp_priority'])
    )
    
    print(f"   ✅ Updated priority for {has_temp.sum()} cells with temperature data")
    
    # Add temperature impact metrics
    print(f"\n6. Computing temperature impact metrics...")
    
    # Convert cooling from C to F for consistency
    merged['tree_cooling_f'] = merged['tree_cooling_c'] * 1.8
    
    # Estimate people affected (use population_density if available, else tree_density as proxy)
    if 'population_density' in merged.columns:
        merged['people_affected'] = merged['population_density'].fillna(0)
    else:
        # Rough estimate: tree_density * 100 = people per km²
        merged['people_affected'] = merged.get('tree_density_per_km2', 0) * 100
    
    # Calculate temperature impact (cooling * people affected)
    merged['temp_impact'] = (
        merged['tree_cooling_f'] * merged['people_affected']
    ).fillna(0)
    
    print(f"   ✅ Computed temperature impact metrics")
    
    # Save updated features
    print(f"\n7. Saving updated features to: {output_path}")
    
    # Create output directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        merged.to_parquet(output_path, index=False)
        print(f"   ✅ Saved {len(merged)} records to {output_path}")
    except Exception as e:
        print(f"   ❌ Error saving file: {e}")
        return None
    
    # Summary statistics
    print(f"\n" + "=" * 60)
    print("Translation Summary")
    print("=" * 60)
    print(f"Total H3 cells: {len(merged)}")
    print(f"Cells with temperature data: {matched_count} ({matched_count/len(merged)*100:.1f}%)")
    print(f"Temperature range: {merged['earth2_temp_c'].min():.2f}°C - {merged['earth2_temp_c'].max():.2f}°C")
    print(f"Cooling range: {merged['tree_cooling_c'].min():.2f}°C - {merged['tree_cooling_c'].max():.2f}°C")
    print(f"Priority range (updated): {merged['priority_final'].min():.3f} - {merged['priority_final'].max():.3f}")
    print(f"\n✅ Translation complete!")
    print(f"   Use the updated features file in urban futures backend:")
    print(f"   {output_path}")
    
    return merged


if __name__ == '__main__':
    # Allow command-line arguments
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Translate untitled folder results to urban futures format'
    )
    parser.add_argument(
        '--untitled-results',
        type=str,
        help='Path to untitled folder results CSV'
    )
    parser.add_argument(
        '--urban-futures-features',
        type=str,
        help='Path to urban futures H3 features parquet'
    )
    parser.add_argument(
        '--output',
        type=str,
        help='Path to save updated features'
    )
    
    args = parser.parse_args()
    
    result = translate_untitled_to_urban_futures(
        untitled_results_path=Path(args.untitled_results) if args.untitled_results else None,
        urban_futures_features_path=Path(args.urban_futures_features) if args.urban_futures_features else None,
        output_path=Path(args.output) if args.output else None
    )
    
    if result is None:
        sys.exit(1)
