#!/usr/bin/env python3
"""
Use urban futures priority scores to guide untitled folder analysis.

This script:
1. Loads urban futures H3 features with priority scores
2. Identifies high-priority hexes for detailed Earth-2 analysis
3. Saves list of priority hexes for use in untitled folder
"""
import pandas as pd
from pathlib import Path
import sys

def use_urban_futures_priority(
    urban_futures_features_path=None,
    priority_threshold=0.7,
    output_path=None,
    max_hexes=None
):
    """
    Use urban futures priority to identify hexes for detailed analysis.
    
    Args:
        urban_futures_features_path: Path to urban futures H3 features
        priority_threshold: Minimum priority score to include (0-1)
        output_path: Path to save priority hex list
        max_hexes: Maximum number of hexes to include (None = all above threshold)
    """
    # Set default paths
    base_dir = Path(__file__).parent
    
    if urban_futures_features_path is None:
        urban_futures_features_path = base_dir / "urban futures" / "data" / "models" / "h3_features.parquet"
    
    if output_path is None:
        output_path = base_dir / "untitled folder" / "data" / "priority_hexes.txt"
    
    print("=" * 60)
    print("Using Urban Futures Priority to Guide Analysis")
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
    
    # Filter high-priority hexes
    print(f"\n2. Filtering hexes with priority >= {priority_threshold}...")
    
    high_priority = urban_futures_data[
        urban_futures_data['priority_final'] >= priority_threshold
    ].copy()
    
    # Sort by priority (highest first)
    high_priority = high_priority.sort_values('priority_final', ascending=False)
    
    print(f"   ✅ Found {len(high_priority)} high-priority hexes")
    
    if len(high_priority) == 0:
        print(f"   ⚠️  No hexes found above threshold. Try lowering priority_threshold.")
        return None
    
    # Limit to max_hexes if specified
    if max_hexes is not None and len(high_priority) > max_hexes:
        print(f"\n3. Limiting to top {max_hexes} hexes...")
        high_priority = high_priority.head(max_hexes)
        print(f"   ✅ Limited to {len(high_priority)} hexes")
    else:
        print(f"\n3. Using all {len(high_priority)} high-priority hexes")
    
    # Extract hex IDs
    priority_hexes = high_priority['h3_cell'].astype(str).tolist()
    
    # Save to file
    print(f"\n4. Saving priority hex list to: {output_path}")
    
    # Create output directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(output_path, 'w') as f:
            for hex_id in priority_hexes:
                f.write(f"{hex_id}\n")
        print(f"   ✅ Saved {len(priority_hexes)} hex IDs to {output_path}")
    except Exception as e:
        print(f"   ❌ Error saving file: {e}")
        return None
    
    # Create detailed CSV with priority info
    csv_output_path = output_path.with_suffix('.csv')
    print(f"\n5. Saving detailed priority info to: {csv_output_path}")
    
    try:
        priority_info = high_priority[[
            'h3_cell', 'priority_final', 'ej_score',
            'heat_vulnerability_index', 'air_quality_score',
            'tree_density_per_km2', 'tree_count'
        ]].copy()
        
        priority_info.to_csv(csv_output_path, index=False)
        print(f"   ✅ Saved detailed info to {csv_output_path}")
    except Exception as e:
        print(f"   ⚠️  Warning: Could not save CSV: {e}")
    
    # Summary statistics
    print(f"\n" + "=" * 60)
    print("Priority Analysis Summary")
    print("=" * 60)
    print(f"Total H3 cells analyzed: {len(urban_futures_data)}")
    print(f"High-priority hexes (>= {priority_threshold}): {len(priority_hexes)}")
    print(f"Priority range: {high_priority['priority_final'].min():.3f} - {high_priority['priority_final'].max():.3f}")
    print(f"EJ score range: {high_priority['ej_score'].min():.3f} - {high_priority['ej_score'].max():.3f}")
    print(f"\n✅ Priority hex list saved!")
    print(f"   Use this file to run Earth-2 predictions only for high-priority areas:")
    print(f"   {output_path}")
    print(f"\n   Example usage in untitled folder:")
    print(f"   python main.py --h3_id <hex_id> --years 1 5 10")
    print(f"   # Or batch process:")
    print(f"   for hex_id in $(cat {output_path}); do")
    print(f"     python main.py --h3_id $hex_id --years 1 5 10")
    print(f"   done")
    
    return priority_hexes


if __name__ == '__main__':
    # Allow command-line arguments
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Use urban futures priority to guide untitled folder analysis'
    )
    parser.add_argument(
        '--urban-futures-features',
        type=str,
        help='Path to urban futures H3 features parquet'
    )
    parser.add_argument(
        '--priority-threshold',
        type=float,
        default=0.7,
        help='Minimum priority score to include (0-1, default: 0.7)'
    )
    parser.add_argument(
        '--max-hexes',
        type=int,
        help='Maximum number of hexes to include (default: all above threshold)'
    )
    parser.add_argument(
        '--output',
        type=str,
        help='Path to save priority hex list'
    )
    
    args = parser.parse_args()
    
    result = use_urban_futures_priority(
        urban_futures_features_path=Path(args.urban_futures_features) if args.urban_futures_features else None,
        priority_threshold=args.priority_threshold,
        output_path=Path(args.output) if args.output else None,
        max_hexes=args.max_hexes
    )
    
    if result is None:
        sys.exit(1)
