#!/usr/bin/env python3
"""
Enhance Urban Futures with accurate temperature data and CO2 reduction predictions.

This script:
1. Loads temperature predictions from untitled folder
2. Calculates CO2 reduction based on tree data
3. Merges with urban futures H3 features
4. Updates priority scores to include temperature data
5. Saves enhanced features for use in urban futures
"""
import pandas as pd
import numpy as np
from pathlib import Path
import sys

# CO2 sequestration rates (based on research)
# Average mature tree sequesters ~48 lbs CO2 per year
# Young trees sequester less, mature trees more
CO2_PER_TREE_PER_YEAR_LBS = 48.0  # Average for mature urban trees
CO2_PER_TREE_PER_YEAR_KG = CO2_PER_TREE_PER_YEAR_LBS * 0.453592  # ~21.77 kg/year


def calculate_co2_reduction(tree_count, avg_dbh=None):
    """
    Calculate CO2 reduction based on tree count and size.
    
    Args:
        tree_count: Number of trees
        avg_dbh: Average diameter at breast height (optional, for size adjustment)
    
    Returns:
        CO2 reduction in kg per year
    """
    # Base calculation: tree_count * average CO2 per tree
    base_co2_kg = tree_count * CO2_PER_TREE_PER_YEAR_KG
    
    # Adjust for tree size if DBH available
    # Larger trees sequester more CO2
    if avg_dbh is not None and not pd.isna(avg_dbh):
        # DBH adjustment: trees with DBH > 20cm sequester more
        # Linear scaling: DBH/20 as multiplier (capped at 2x for very large trees)
        size_multiplier = np.clip(avg_dbh / 20.0, 0.5, 2.0)
        base_co2_kg = base_co2_kg * size_multiplier
    
    return base_co2_kg


def enhance_urban_futures(
    untitled_results_path=None,
    urban_futures_features_path=None,
    output_path=None
):
    """
    Enhance urban futures with temperature data and CO2 calculations.
    """
    # Set default paths
    base_dir = Path(__file__).parent
    
    if untitled_results_path is None:
        untitled_results_path = base_dir / "untitled folder" / "data" / "processed" / "FINAL_REAL_RESULTS.csv"
    
    if urban_futures_features_path is None:
        urban_futures_features_path = base_dir / "urban futures" / "data" / "models" / "h3_features.parquet"
    
    if output_path is None:
        output_path = base_dir / "urban futures" / "data" / "models" / "h3_features.parquet"  # Overwrite original
    
    print("=" * 60)
    print("Enhancing Urban Futures with Accurate Data")
    print("=" * 60)
    
    # Load urban futures features
    print(f"\n1. Loading urban futures features from: {urban_futures_features_path}")
    if not urban_futures_features_path.exists():
        print(f"   ❌ Error: File not found: {urban_futures_features_path}")
        return None
    
    try:
        urban_futures_data = pd.read_parquet(urban_futures_features_path)
        print(f"   ✅ Loaded {len(urban_futures_data)} H3 cells")
    except Exception as e:
        print(f"   ❌ Error loading file: {e}")
        return None
    
    # Load untitled folder results if available
    print(f"\n2. Loading untitled folder temperature data from: {untitled_results_path}")
    temp_data = None
    if untitled_results_path.exists():
        try:
            untitled_data = pd.read_csv(untitled_results_path)
            print(f"   ✅ Loaded {len(untitled_data)} records")
            
            # Aggregate by hex_id (in case of multiple target_reduction rows)
            temp_data = untitled_data.groupby('hex_id').agg({
                'current_temperature_c': 'mean',
                'current_reduction': 'mean',
                'current_tree_count': 'first',
                'lat': 'first',
                'lon': 'first'
            }).reset_index()
            
            # Rename columns
            temp_data = temp_data.rename(columns={
                'hex_id': 'h3_cell',
                'current_temperature_c': 'earth2_temp_c',
                'current_reduction': 'tree_cooling_c',
                'current_tree_count': 'earth2_tree_count'
            })
            
            print(f"   ✅ Extracted temperature data for {len(temp_data)} unique hexes")
        except Exception as e:
            print(f"   ⚠️  Warning: Could not load temperature data: {e}")
            print(f"   Continuing without temperature data...")
    else:
        print(f"   ⚠️  Warning: Temperature data file not found")
        print(f"   Continuing without temperature data...")
    
    # Calculate CO2 reduction for all cells
    print(f"\n3. Calculating CO2 reduction for all H3 cells...")
    
    # Use tree_count and avg_dbh from urban futures data
    urban_futures_data['co2_reduction_kg_per_year'] = urban_futures_data.apply(
        lambda row: calculate_co2_reduction(
            tree_count=row.get('tree_count', 0),
            avg_dbh=row.get('avg_dbh', None)
        ),
        axis=1
    )
    
    # Also calculate for recommended tree count (priority-based estimate)
    # Recommended trees = priority_final * 100 + tree_gap * 50
    urban_futures_data['recommended_tree_count'] = (
        urban_futures_data['priority_final'] * 100 + 
        urban_futures_data['tree_gap'] * 50
    ).clip(lower=0).round().astype(int)
    
    # CO2 reduction if recommended trees are planted
    urban_futures_data['projected_co2_reduction_kg_per_year'] = urban_futures_data.apply(
        lambda row: calculate_co2_reduction(
            tree_count=row['recommended_tree_count'],
            avg_dbh=row.get('avg_dbh', None)
        ),
        axis=1
    )
    
    # Additional CO2 from new trees (difference)
    urban_futures_data['additional_co2_reduction_kg_per_year'] = (
        urban_futures_data['projected_co2_reduction_kg_per_year'] - 
        urban_futures_data['co2_reduction_kg_per_year']
    )
    
    print(f"   ✅ Calculated CO2 reduction for all cells")
    print(f"   Current CO2 reduction: {urban_futures_data['co2_reduction_kg_per_year'].sum():.1f} kg/year")
    print(f"   Projected CO2 reduction: {urban_futures_data['projected_co2_reduction_kg_per_year'].sum():.1f} kg/year")
    
    # Merge temperature data if available
    if temp_data is not None:
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
        print(f"   ✅ Matched {matched_count} / {len(urban_futures_data)} H3 cells with temperature data")
        
        # Update priority scores to include temperature
        print(f"\n5. Updating priority scores with temperature data...")
        
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
        has_temp = merged['earth2_temp_c'].notna()
        merged.loc[has_temp, 'priority_final'] = (
            merged.loc[has_temp, 'priority_final'] * 
            (1 + 0.2 * merged.loc[has_temp, 'temp_priority'])
        )
        
        print(f"   ✅ Updated priority for {has_temp.sum()} cells with temperature data")
        
        urban_futures_data = merged
    else:
        print(f"\n4. Skipping temperature merge (data not available)")
    
    # Save enhanced features
    print(f"\n6. Saving enhanced features to: {output_path}")
    
    # Create output directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        urban_futures_data.to_parquet(output_path, index=False)
        print(f"   ✅ Saved {len(urban_futures_data)} records to {output_path}")
    except Exception as e:
        print(f"   ❌ Error saving file: {e}")
        return None
    
    # Also save as JSON for backend
    json_output_path = output_path.parent / "h3_features.json"
    print(f"\n7. Saving JSON format for backend to: {json_output_path}")
    
    try:
        # Convert to JSON-compatible format
        json_df = urban_futures_data.copy()
        # Replace NaN/NaT with None for JSON serialization
        json_df = json_df.replace({pd.NA: None, pd.NaT: None})
        json_df = json_df.where(pd.notnull(json_df), None)
        
        # Convert to dict and clean up any remaining NaN/Inf values
        json_records = json_df.to_dict('records')
        for record in json_records:
            for key, value in record.items():
                if pd.isna(value) or (isinstance(value, float) and (np.isinf(value) or np.isnan(value))):
                    record[key] = None
        
        import json as json_lib
        with open(json_output_path, 'w') as f:
            json_lib.dump(json_records, f, indent=2)
        print(f"   ✅ Saved JSON to {json_output_path}")
    except Exception as e:
        print(f"   ⚠️  Warning: Could not save JSON: {e}")
    
    # Summary statistics
    print(f"\n" + "=" * 60)
    print("Enhancement Summary")
    print("=" * 60)
    print(f"Total H3 cells: {len(urban_futures_data)}")
    
    if temp_data is not None:
        matched = urban_futures_data['earth2_temp_c'].notna().sum()
        print(f"Cells with temperature data: {matched} ({matched/len(urban_futures_data)*100:.1f}%)")
        if matched > 0:
            print(f"Temperature range: {urban_futures_data['earth2_temp_c'].min():.2f}°C - {urban_futures_data['earth2_temp_c'].max():.2f}°C")
            print(f"Cooling range: {urban_futures_data['tree_cooling_c'].min():.2f}°C - {urban_futures_data['tree_cooling_c'].max():.2f}°C")
    
    print(f"\nCO2 Reduction:")
    print(f"  Current: {urban_futures_data['co2_reduction_kg_per_year'].sum():,.0f} kg/year ({urban_futures_data['co2_reduction_kg_per_year'].sum()/1000:.1f} metric tons/year)")
    print(f"  Projected: {urban_futures_data['projected_co2_reduction_kg_per_year'].sum():,.0f} kg/year ({urban_futures_data['projected_co2_reduction_kg_per_year'].sum()/1000:.1f} metric tons/year)")
    print(f"  Additional: {urban_futures_data['additional_co2_reduction_kg_per_year'].sum():,.0f} kg/year ({urban_futures_data['additional_co2_reduction_kg_per_year'].sum()/1000:.1f} metric tons/year)")
    
    print(f"\nPriority range: {urban_futures_data['priority_final'].min():.3f} - {urban_futures_data['priority_final'].max():.3f}")
    print(f"\n✅ Enhancement complete!")
    print(f"   Enhanced features saved to: {output_path}")
    
    return urban_futures_data


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Enhance urban futures with temperature data and CO2 calculations'
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
        help='Path to save enhanced features'
    )
    
    args = parser.parse_args()
    
    result = enhance_urban_futures(
        untitled_results_path=Path(args.untitled_results) if args.untitled_results else None,
        urban_futures_features_path=Path(args.urban_futures_features) if args.urban_futures_features else None,
        output_path=Path(args.output) if args.output else None
    )
    
    if result is None:
        sys.exit(1)
