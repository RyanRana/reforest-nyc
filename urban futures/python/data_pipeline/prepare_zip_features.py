"""
NYC Climate Resilience Spatial Simulation - Data Preparation Pipeline
Prepares ZIP-level features for the neural network model.
"""

import pandas as pd
import numpy as np
import geopandas as gpd
from shapely.geometry import Point
from scipy.spatial.distance import cdist
import json
import os
from pathlib import Path
from h3_utils import (
    trees_to_h3_cells,
    create_h3_grid_for_nyc,
    find_tree_gaps,
    find_tree_clusters,
    prioritize_planting_sites,
    aggregate_h3_to_zip,
    get_h3_resolution_for_area
)

# Base paths
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = DATA_DIR / "cache"
PROCESSED_DIR = DATA_DIR / "processed"
EXTERNAL_DIR = DATA_DIR / "external"
OUTPUT_DIR = BASE_DIR / "data" / "models"


def load_zip_boundaries():
    """Load ZIP code boundaries shapefile, filtered to NYC area only."""
    zip_path = EXTERNAL_DIR / "nyc_zip_boundaries" / "tl_2010_36_zcta510.shp"
    gdf = gpd.read_file(zip_path)
    gdf['zipcode'] = gdf['ZCTA5CE10'].astype(str)
    
    # Filter to NYC ZIP codes only (10xxx, 11xxx for NYC boroughs)
    # NYC ZIP codes: 100xx-104xx, 11xxx (Bronx, Manhattan, Brooklyn, Queens, Staten Island)
    nyc_zip_pattern = gdf['zipcode'].str.match(r'^(10[0-4]\d\d|11\d\d\d)$')
    gdf_nyc = gdf[nyc_zip_pattern].copy()
    
    print(f"  Loaded {len(gdf_nyc)} NYC ZIP codes (filtered from {len(gdf)} total NY State ZIPs)")
    print(f"  NYC ZIP bounds: {gdf_nyc.total_bounds}")
    
    return gdf_nyc[['zipcode', 'geometry']]


def load_heat_vulnerability():
    """Load heat vulnerability index by ZIP."""
    df = pd.read_parquet(PROCESSED_DIR / "heat_vulnerability_processed.parquet")
    # Ensure zipcode is string
    df['zipcode'] = df['zipcode'].astype(str)
    return df


def load_air_quality():
    """Load air quality data and interpolate from Community District to ZIP."""
    df = pd.read_parquet(PROCESSED_DIR / "air_quality_processed.parquet")
    
    # Filter for PM2.5 and NO2
    df = df[df['pollutant'].isin(['PM2.5', 'NO2'])]
    
    # Get annual averages
    annual = df[df['time_period'].str.contains('Annual', na=False)]
    
    # Group by location and pollutant, take mean
    air_by_cd = annual.groupby(['location', 'pollutant'])['value'].mean().reset_index()
    
    # Pivot to get PM2.5 and NO2 as columns
    air_pivot = air_by_cd.pivot(index='location', columns='pollutant', values='value').reset_index()
    air_pivot.columns.name = None
    
    # Fill missing values with 0
    if 'PM2.5' not in air_pivot.columns:
        air_pivot['PM2.5'] = 0
    if 'NO2' not in air_pivot.columns:
        air_pivot['NO2'] = 0
    
    air_pivot['air_quality_score'] = air_pivot['PM2.5'].fillna(0) + air_pivot['NO2'].fillna(0)
    
    return air_pivot[['location', 'air_quality_score']]


def load_fuel_oil():
    """Load fuel oil data by ZIP."""
    df = pd.read_parquet(PROCESSED_DIR / "fuel_oil_processed.parquet")
    # Ensure zipcode is string
    df['zipcode'] = df['zipcode'].astype(str)
    return df


def load_indoor_environmental():
    """Load indoor environmental complaints and aggregate by ZIP."""
    df = pd.read_parquet(PROCESSED_DIR / "indoor_environmental_processed.parquet")
    
    # Extract ZIP code
    df['zipcode'] = df['Incident_Address_Zip'].astype(str).str.zfill(5)
    
    # Count complaints per ZIP
    complaints_by_zip = df.groupby('zipcode').size().reset_index(name='indoor_complaints')
    
    return complaints_by_zip


def load_cooling_sites():
    """Load cooling sites and compute proximity features."""
    df = pd.read_parquet(PROCESSED_DIR / "cooling_sites_processed.parquet")
    # Convert to GeoDataFrame if geometry column exists
    if 'geometry' in df.columns:
        # Check if geometry is bytes (WKB) and needs conversion
        if isinstance(df['geometry'].iloc[0], bytes):
            from shapely import wkb
            df['geometry'] = df['geometry'].apply(lambda x: wkb.loads(x) if isinstance(x, bytes) else x)
        # Convert to GeoDataFrame
        if not isinstance(df, gpd.GeoDataFrame):
            df = gpd.GeoDataFrame(df, geometry='geometry', crs='EPSG:4326')
    return df


def load_oer_cleanup_sites():
    """Load cleanup sites for exclusion mask."""
    df = pd.read_parquet(PROCESSED_DIR / "oer_cleanup_sites_processed.parquet")
    return df


def load_street_trees():
    """Load street trees and compute ZIP-level statistics."""
    print("Loading street trees (this may take a moment)...")
    df = pd.read_csv(CACHE_DIR / "street_trees_2015.csv", low_memory=False)
    
    # Filter alive trees only
    df = df[df['status'] == 'Alive']
    
    # Extract ZIP from coordinates if available, or use other methods
    if 'latitude' in df.columns and 'longitude' in df.columns:
        df = df.dropna(subset=['latitude', 'longitude'])
        df['geometry'] = [Point(lon, lat) for lon, lat in zip(df['longitude'], df['latitude'])]
        trees_gdf = gpd.GeoDataFrame(df, crs='EPSG:4326')
    else:
        return None
    
    return trees_gdf


def compute_tree_density_by_zip(zip_gdf, trees_gdf):
    """Compute tree density and DBH distribution by ZIP."""
    # Ensure both have same CRS
    zip_gdf = zip_gdf.to_crs('EPSG:4326')
    trees_gdf = trees_gdf.to_crs('EPSG:4326')

    # Spatial join trees to ZIP codes
    trees_in_zip = gpd.sjoin(trees_gdf, zip_gdf, how='inner', predicate='within')

    # Compute tree statistics per ZIP
    tree_stats = trees_in_zip.groupby('zipcode').agg({
        'tree_id': 'count',
        'tree_dbh': ['mean', 'std']
    }).reset_index()

    tree_stats.columns = ['zipcode', 'tree_count', 'avg_dbh', 'std_dbh']

    # Compute tree density (trees per square km)
    zip_gdf['area_km2'] = zip_gdf.geometry.to_crs('EPSG:3857').area / 1e6
    zip_area = zip_gdf[['zipcode', 'area_km2']]

    tree_stats = tree_stats.merge(zip_area, on='zipcode', how='left')
    tree_stats['tree_density'] = tree_stats['tree_count'] / tree_stats['area_km2'].fillna(1)
    tree_stats['tree_density'] = tree_stats['tree_density'].fillna(0)

    return tree_stats[['zipcode', 'tree_count', 'tree_density', 'avg_dbh', 'std_dbh']]


def compute_tree_density_by_h3_or_zip(zip_gdf, trees_gdf, use_h3=True, h3_resolution=9):
    """Compute tree density using either ZIP boundaries or H3 grid.

    Args:
        zip_gdf: ZIP code boundaries GeoDataFrame
        trees_gdf: Tree locations GeoDataFrame
        use_h3: Whether to use H3 grid instead of ZIP boundaries
        h3_resolution: H3 resolution (9 = ~1km² cells)

    Returns:
        GeoDataFrame with tree statistics
    """
    if use_h3 and trees_gdf is not None:
        print(f"Computing tree density using H3 grid (resolution {h3_resolution})...")
        return trees_to_h3_cells(trees_gdf, h3_resolution)
    else:
        print("Computing tree density using ZIP boundaries...")
        return compute_tree_density_by_zip(zip_gdf, trees_gdf)


def analyze_tree_gaps_and_clusters(h3_tree_data, gap_threshold=5.0, cluster_threshold=50.0):
    """Analyze tree gaps and clusters for planting prioritization.

    Args:
        h3_tree_data: H3-based tree data from compute_tree_density_by_h3_or_zip
        gap_threshold: Tree density threshold below which areas are considered gaps
        cluster_threshold: Tree density threshold above which areas are considered clusters

    Returns:
        Dict with gap cells, cluster cells, and prioritized planting sites
    """
    print(f"Analyzing tree gaps (density < {gap_threshold}/km²) and clusters (density >= {cluster_threshold}/km²)...")

    # Find gaps and clusters
    gap_cells = find_tree_gaps(h3_tree_data, gap_threshold)
    cluster_cells = find_tree_clusters(h3_tree_data, cluster_threshold)

    print(f"Found {len(gap_cells)} tree gaps and {len(cluster_cells)} tree clusters")

    # Prioritize planting sites based on proximity to clusters
    if gap_cells and cluster_cells:
        prioritized_sites = prioritize_planting_sites(gap_cells, cluster_cells)
        print(f"Prioritized {len(prioritized_sites)} planting sites")
    else:
        prioritized_sites = []

    return {
        'gap_cells': gap_cells,
        'cluster_cells': cluster_cells,
        'prioritized_sites': prioritized_sites
    }


def compute_cooling_site_proximity(zip_gdf, cooling_sites):
    """Compute distance to nearest cooling site for each ZIP."""
    result = zip_gdf[['zipcode']].copy()
    
    # Check if cooling_sites is valid GeoDataFrame with geometry
    if cooling_sites.empty:
        result['cooling_site_distance'] = np.inf
        return result
    
    # Ensure cooling_sites is a GeoDataFrame
    if not isinstance(cooling_sites, gpd.GeoDataFrame):
        if 'geometry' in cooling_sites.columns:
            try:
                cooling_sites = gpd.GeoDataFrame(cooling_sites, geometry='geometry', crs='EPSG:4326')
            except:
                result['cooling_site_distance'] = np.inf
                return result
        else:
            result['cooling_site_distance'] = np.inf
            return result
    
    # Ensure both are GeoDataFrames with proper CRS
    zip_gdf = zip_gdf.to_crs('EPSG:4326')
    cooling_gdf = cooling_sites.to_crs('EPSG:4326')
    
    # Get ZIP centroids (reproject to projected CRS for accurate distance)
    zip_centroids_proj = zip_gdf.to_crs('EPSG:3857')  # Web Mercator for distance calculation
    zip_centroids_geom = zip_centroids_proj.geometry.centroid
    
    # Get cooling site centroids
    cooling_proj = cooling_gdf.to_crs('EPSG:3857')
    cooling_centroids_geom = cooling_proj.geometry.centroid
    
    # Compute distances using vectorized operations
    distances = []
    for zip_centroid in zip_centroids_geom:
        dists = cooling_centroids_geom.distance(zip_centroid)
        min_dist = dists.min() / 1000  # Convert meters to km
        distances.append(min_dist)
    
    result['cooling_site_distance'] = distances
    
    return result


def interpolate_air_quality_to_zip(zip_gdf, air_quality_cd):
    """Interpolate Community District air quality to ZIP using weighted distance."""
    # This is a simplified version - in production, you'd use proper CD boundaries
    # For now, we'll assign average air quality to all ZIPs
    avg_air_quality = air_quality_cd['air_quality_score'].mean()
    
    # Ensure we have a valid value
    if pd.isna(avg_air_quality) or avg_air_quality == 0:
        avg_air_quality = 10.0  # Default value if no data
    
    result = pd.DataFrame({
        'zipcode': zip_gdf['zipcode'],
        'air_quality_score': avg_air_quality
    })
    
    return result


def load_population_data():
    """Load population data by Community District and interpolate to ZIP."""
    pop_path = EXTERNAL_DIR / "nyc_population_community_districts.csv"
    if pop_path.exists():
        df = pd.read_csv(pop_path)
        # Simplified: assign average population density
        # In production, would use spatial join
        return df
    return None


def load_equity_score_data():
    """Load equity score data from congressional data CSV."""
    equity_path = BASE_DIR / "data" / "nyc_zip_congressional_data.csv"
    if equity_path.exists():
        try:
            df = pd.read_csv(equity_path)
            # Ensure zipcode is string and matches format
            df['zipcode'] = df['ZIP_Code'].astype(str).str.zfill(5)
            # Extract equity score and median income
            equity_df = df[['zipcode', 'Equity_Score', 'Median_Income', 'Population']].copy()
            equity_df.columns = ['zipcode', 'equity_score', 'median_income', 'population']
            return equity_df
        except Exception as e:
            print(f"Warning: Could not load equity score data: {e}")
            return None
    return None


def compute_ej_score(indoor_complaints, hvi, equity_score=None, pop_density=None):
    """Compute environmental justice score.
    
    Combines multiple vulnerability indicators:
    - Indoor environmental complaints (proxy for housing/environmental burden)
    - Heat vulnerability index (HVI) - health and infrastructure vulnerability
    - Equity score (if available) - includes income, minority population, linguistic isolation, housing burden
    - Population density (if available) - higher density = more people affected
    
    Formula: Normalized average of available indicators
    """
    # Normalize each component (handle division by zero)
    def safe_normalize(series):
        min_val = series.min()
        max_val = series.max()
        if max_val - min_val < 1e-6:
            return pd.Series([0.5] * len(series), index=series.index)
        return (series - min_val) / (max_val - min_val + 1e-6)
    
    # Normalize components - ensure they're Series and aligned by index
    # Handle indoor complaints - fill NaN with 0 (no complaints)
    indoor_filled = indoor_complaints.fillna(0)
    # Only normalize if there's variation
    if indoor_filled.nunique() > 1:
        indoor_norm = safe_normalize(indoor_filled)
    else:
        # If all same value, use that value (normalized will be 0.5, but we want actual variation)
        indoor_norm = pd.Series([0.5] * len(indoor_complaints), index=indoor_complaints.index)
        print(f"    WARNING: Indoor complaints have no variation (all {indoor_filled.iloc[0]:.1f})")
    
    # Handle HVI - if all NaN, use default value
    hvi_median = hvi.median() if hvi.notna().any() else 0.5
    hvi_filled = hvi.fillna(hvi_median)
    # Only normalize if there's variation
    if hvi_filled.nunique() > 1:
        hvi_norm = safe_normalize(hvi_filled)
    else:
        hvi_norm = pd.Series([0.5] * len(hvi), index=hvi.index)
        print(f"    WARNING: HVI has no variation (all {hvi_filled.iloc[0]:.3f})")
    
    components = [indoor_norm, hvi_norm]
    weights = [0.5, 0.5]  # Equal weights if we only have these two components
    
    # Add equity score if available (this includes income, minority, linguistic isolation, housing)
    if equity_score is not None and isinstance(equity_score, pd.Series):
        # Check if it has non-null values AND has variation (not all the same)
        if equity_score.notna().any():
            equity_aligned = equity_score.reindex(indoor_complaints.index)
            # Only use if there's actual variation (not all the same value)
            if equity_aligned.nunique() > 1:
                equity_filled = equity_aligned.fillna(equity_score.median())
                equity_norm = safe_normalize(equity_filled)
                components.append(equity_norm)
                weights.append(0.4)  # Higher weight for comprehensive equity score
                print(f"    Added equity score to EJ calculation ({equity_score.notna().sum()} non-null values, {equity_aligned.nunique()} unique values)")
            else:
                print(f"    Equity score has no variation (all values are {equity_aligned.iloc[0]:.3f}), skipping")
        else:
            print(f"    Equity score not available or all NaN")
    else:
        print(f"    Equity score column not found or not a Series")
    
    # Add population density if available
    if pop_density is not None and isinstance(pop_density, pd.Series):
        if pop_density.notna().any():
            pop_aligned = pop_density.reindex(indoor_complaints.index)
            # Only use if there's actual variation (not all the same value)
            if pop_aligned.nunique() > 1:
                pop_filled = pop_aligned.fillna(pop_density.median())
                pop_norm = safe_normalize(pop_filled)
                components.append(pop_norm)
                weights.append(0.1)  # Lower weight for population density
                print(f"    Added population density to EJ calculation ({pop_density.notna().sum()} non-null values, {pop_aligned.nunique()} unique values)")
            else:
                print(f"    Population density has no variation (all values are {pop_aligned.iloc[0]:.1f}), skipping")
        else:
            print(f"    Population density not available or all NaN")
    else:
        print(f"    Population density column not found or not a Series")
    
    # Normalize weights to sum to 1
    total_weight = sum(weights)
    if total_weight > 0:
        weights = [w / total_weight for w in weights]
    else:
        # Fallback: equal weights
        weights = [1.0 / len(components)] * len(components)
    
    # Calculate weighted average
    ej_score = pd.Series(0.0, index=indoor_complaints.index)
    for component, weight in zip(components, weights):
        # Only add if component has valid values
        if component.notna().any():
            ej_score += component * weight
        else:
            print(f"    WARNING: Component has all NaN values, skipping")
    
    # If we only have indoor_complaints and HVI, and they both have variation, we should get variation in EJ scores
    # If equity_score and population are all the same (0.5), they won't contribute to variation
    
    # Check if we got any valid scores
    if ej_score.notna().sum() == 0:
        print(f"    ERROR: All EJ scores are NaN! Check input data.")
        # Fallback: use a default value based on available data
        if indoor_filled.notna().any():
            ej_score = safe_normalize(indoor_filled).fillna(0.5)
        else:
            ej_score = pd.Series([0.5] * len(indoor_complaints), index=indoor_complaints.index)
    elif ej_score.max() - ej_score.min() < 1e-6:
        print(f"    WARNING: All EJ scores are the same ({ej_score.iloc[0]:.4f}). Check input data.")
    else:
        print(f"    EJ scores computed successfully: {ej_score.notna().sum()} non-null, range {ej_score.min():.4f} - {ej_score.max():.4f}")
    
    # Ensure scores are in [0, 1] range and fill any remaining NaN with median
    ej_score = ej_score.clip(0, 1)
    if ej_score.isna().any():
        ej_median = ej_score.median() if ej_score.notna().any() else 0.5
        ej_score = ej_score.fillna(ej_median)
    
    return ej_score


def compute_priority_scores(features_df):
    """Compute priority scores for each ZIP or H3 cell."""
    df = features_df.copy()

    # Normalize features
    def normalize(col):
        min_val = col.min()
        max_val = col.max()
        if max_val - min_val < 1e-6:
            return pd.Series([0.5] * len(col), index=col.index)
        return (col - min_val) / (max_val - min_val)

    df['heat_score'] = normalize(df['heat_vulnerability_index'])
    df['air_score'] = normalize(df['air_quality_score'])

    # Handle tree density column name (different for ZIP vs H3)
    tree_density_col = 'tree_density_per_km2' if 'tree_density_per_km2' in df.columns else 'tree_density'
    tree_density_norm = normalize(df[tree_density_col])
    df['tree_gap'] = 1 - tree_density_norm

    df['pollution_proxy'] = normalize(df['total_fuel_oil_gallons'].fillna(0))
    # Don't re-normalize EJ score - it's already normalized in compute_ej_score
    # Just ensure it's in valid range [0, 1]
    df['ej_score'] = df['ej_score'].clip(0, 1)

    # Compute priority
    df['priority_base'] = (
        0.35 * df['heat_score'] +
        0.25 * df['air_score'] +
        0.25 * df['tree_gap'] +
        0.15 * df['pollution_proxy']
    )

    df['priority_final'] = df['priority_base'] * (1 + 0.4 * df['ej_score'])

    return df


def main(use_h3=True, h3_resolution=9):
    """Main data preparation pipeline.

    Args:
        use_h3: Whether to use H3 grid analysis instead of ZIP boundaries
        h3_resolution: H3 resolution for grid analysis (9 = ~1km² cells)
    """
    print(f"Starting {'H3' if use_h3 else 'ZIP'}-level feature preparation...")

    # Load ZIP boundaries
    print("Loading ZIP boundaries...")
    zip_gdf = load_zip_boundaries()

    # Load all datasets
    print("Loading datasets...")
    hvi_df = load_heat_vulnerability()
    air_quality_cd = load_air_quality()
    fuel_oil_df = load_fuel_oil()
    indoor_env_df = load_indoor_environmental()
    cooling_sites_df = load_cooling_sites()
    equity_df = load_equity_score_data()

    # Load street trees
    trees_gdf = load_street_trees()

    # Compute tree statistics (H3 or ZIP based)
    tree_stats = compute_tree_density_by_h3_or_zip(zip_gdf, trees_gdf, use_h3, h3_resolution)

    # Analyze gaps and clusters if using H3
    if use_h3 and trees_gdf is not None:
        gap_analysis = analyze_tree_gaps_and_clusters(tree_stats)
        print(f"Gap analysis complete: {len(gap_analysis['gap_cells'])} gaps, {len(gap_analysis['cluster_cells'])} clusters")

        # Save gap analysis for later use
        gap_analysis_path = OUTPUT_DIR / "gap_analysis.json"
        with open(gap_analysis_path, 'w') as f:
            json.dump({
                'gap_cells': gap_analysis['gap_cells'],
                'cluster_cells': gap_analysis['cluster_cells'],
                'prioritized_sites': [(cell, float(score)) for cell, score in gap_analysis['prioritized_sites']]
            }, f, indent=2)
        print(f"Saved gap analysis to {gap_analysis_path}")
    
    # Compute cooling site proximity
    print("Computing cooling site proximity...")
    cooling_proximity = compute_cooling_site_proximity(zip_gdf, cooling_sites_df)
    
    # Interpolate air quality to ZIP
    print("Interpolating air quality to ZIP...")
    air_quality_zip = interpolate_air_quality_to_zip(zip_gdf, air_quality_cd)
    
    if use_h3:
        # H3-based feature preparation
        print("Preparing H3-based features...")

        # Start with H3 tree data as base
        # Ensure it's a GeoDataFrame with proper CRS
        if not isinstance(tree_stats, gpd.GeoDataFrame):
            if 'geometry' in tree_stats.columns:
                features_df = gpd.GeoDataFrame(tree_stats, geometry='geometry', crs='EPSG:4326')
            else:
                print("ERROR: tree_stats doesn't have geometry column!")
                features_df = tree_stats.copy()
        else:
            features_df = tree_stats.copy()
            if features_df.crs is None:
                features_df.set_crs('EPSG:4326', inplace=True)
        
        # Ensure ZIP boundaries have same CRS
        if zip_gdf.crs is None:
            zip_gdf.set_crs('EPSG:4326', inplace=True)
        else:
            zip_gdf = zip_gdf.to_crs('EPSG:4326')
        
        # Debug: Check geometries
        print(f"  H3 cells CRS: {features_df.crs}")
        print(f"  ZIP codes CRS: {zip_gdf.crs}")
        print(f"  Sample H3 geometry: {features_df.iloc[0]['geometry'] if len(features_df) > 0 else 'None'}")
        print(f"  Sample ZIP geometry: {zip_gdf.iloc[0]['geometry'] if len(zip_gdf) > 0 else 'None'}")

        # For H3 cells, we need to interpolate environmental data from ZIP level
        # Create ZIP-to-H3 mapping for environmental data
        zip_to_h3_mapping = {}
        print(f"  Mapping {len(features_df)} H3 cells to ZIP codes...")
        mapped_count = 0
        for idx, row in features_df.iterrows():
            cell_geom = row['geometry']
            if cell_geom is None or pd.isna(cell_geom):
                continue
            # Find which ZIP this cell intersects most
            try:
                intersections = zip_gdf[zip_gdf.intersects(cell_geom)]
                if not intersections.empty:
                    # Use ZIP with largest intersection
                    intersection_areas = intersections.geometry.intersection(cell_geom).area
                    best_zip_idx = intersection_areas.idxmax()
                    best_zip = zip_gdf.loc[best_zip_idx, 'zipcode']
                    zip_to_h3_mapping[row['h3_cell']] = best_zip
                    mapped_count += 1
            except Exception as e:
                # Skip cells with geometry errors
                continue
        print(f"  Successfully mapped {mapped_count} H3 cells to ZIP codes")

        # Ensure zipcode is string type for consistent merging
        # Handle cases where H3 cell doesn't map to a ZIP (will be NaN)
        features_df['zipcode'] = features_df['h3_cell'].map(zip_to_h3_mapping)
        # Count how many cells have valid ZIP codes BEFORE conversion
        valid_zips = features_df['zipcode'].notna().sum()
        print(f"  H3 cells with valid ZIP mapping: {valid_zips} / {len(features_df)}")
        
        # Convert to string for merging - handle NaN properly
        # First convert all to string, then replace 'nan' strings with pd.NA
        if valid_zips > 0:
            features_df['zipcode'] = features_df['zipcode'].astype(str)
            features_df.loc[features_df['zipcode'] == 'nan', 'zipcode'] = pd.NA
            
            # Debug: show sample of zipcodes after mapping
            sample_zips = features_df['zipcode'].dropna().head(5).tolist()
            print(f"  Sample ZIP codes after mapping: {sample_zips}")
        else:
            print("  WARNING: No H3 cells were mapped to ZIP codes! Using fallback approach...")
            # Use h3_cells_to_zip_mapping utility function from h3_utils
            from h3_utils import h3_cells_to_zip_mapping as h3_to_zip_util
            h3_cells_list = features_df['h3_cell'].tolist()
            zip_to_h3_mapping_util = h3_to_zip_util(h3_cells_list, zip_gdf)
            features_df['zipcode'] = features_df['h3_cell'].map(zip_to_h3_mapping_util)
            valid_zips = features_df['zipcode'].notna().sum()
            print(f"  After fallback mapping: {valid_zips} / {len(features_df)} H3 cells have ZIP codes")
            features_df['zipcode'] = features_df['zipcode'].astype(str)
            features_df.loc[features_df['zipcode'] == 'nan', 'zipcode'] = pd.NA

        # Merge environmental data using ZIP mapping
        env_data_sources = [
            (hvi_df, 'heat_vulnerability_index', 'median'),
            (air_quality_zip, 'air_quality_score', 'mean'),
            (fuel_oil_df, 'total_fuel_oil_gallons', 0),
            (indoor_env_df, 'indoor_complaints', 0)
        ]
        
        # Add equity score data if available
        if equity_df is not None:
            env_data_sources.append((equity_df, 'equity_score', 'median'))
            env_data_sources.append((equity_df, 'population', 'median'))

        for env_df, col_name, fill_value in env_data_sources:
            if col_name in env_df.columns:
                # Ensure zipcode is string in env data too
                env_merge_df = env_df.copy()
                env_merge_df['zipcode'] = env_merge_df['zipcode'].astype(str)
                # Remove any rows with invalid zipcodes (nan, None, empty)
                env_merge_df = env_merge_df[env_merge_df['zipcode'].notna() & (env_merge_df['zipcode'] != 'nan') & (env_merge_df['zipcode'] != '') & (env_merge_df['zipcode'] != '<NA>')]

                # Debug: check if we have matching ZIP codes
                before_merge_count = len(features_df)
                features_df = features_df.merge(env_merge_df[['zipcode', col_name]], on='zipcode', how='left')
                matched_count = features_df[col_name].notna().sum()
                print(f"    Merged {col_name}: {matched_count}/{before_merge_count} H3 cells got values from ZIP data")
                
                if fill_value == 'median':
                    median_val = features_df[col_name].median()
                    if pd.notna(median_val):
                        features_df[col_name] = features_df[col_name].fillna(median_val)
                    else:
                        # If all NaN, use a default based on column type
                        features_df[col_name] = features_df[col_name].fillna(0.5 if 'score' in col_name or 'index' in col_name else 0)
                elif fill_value == 'mean':
                    mean_val = features_df[col_name].mean()
                    if pd.notna(mean_val):
                        features_df[col_name] = features_df[col_name].fillna(mean_val)
                    else:
                        features_df[col_name] = features_df[col_name].fillna(0.5 if 'score' in col_name or 'index' in col_name else 0)
                else:
                    features_df[col_name] = features_df[col_name].fillna(fill_value)

    else:
        # ZIP-based feature preparation (original logic)
        print("Merging features by ZIP...")
        features_df = zip_gdf[['zipcode']].copy()

        # Merge HVI
        features_df = features_df.merge(hvi_df, on='zipcode', how='left')
        features_df['heat_vulnerability_index'] = features_df['heat_vulnerability_index'].fillna(
            features_df['heat_vulnerability_index'].median()
        )

        # Merge air quality
        features_df = features_df.merge(air_quality_zip, on='zipcode', how='left')
        features_df['air_quality_score'] = features_df['air_quality_score'].fillna(
            features_df['air_quality_score'].mean()
        )

        # Merge fuel oil
        features_df = features_df.merge(fuel_oil_df, on='zipcode', how='left')
        features_df['total_fuel_oil_gallons'] = features_df['total_fuel_oil_gallons'].fillna(0)

        # Merge indoor environmental
        features_df = features_df.merge(indoor_env_df, on='zipcode', how='left')
        features_df['indoor_complaints'] = features_df['indoor_complaints'].fillna(0)
        
        # Merge equity score data if available
        if equity_df is not None:
            features_df = features_df.merge(equity_df, on='zipcode', how='left')
            features_df['equity_score'] = features_df['equity_score'].fillna(features_df['equity_score'].median())
            features_df['population'] = features_df['population'].fillna(features_df['population'].median())

        # Merge tree stats
        features_df = features_df.merge(tree_stats, on='zipcode', how='left')
        features_df['tree_count'] = features_df['tree_count'].fillna(0)
        features_df['tree_density'] = features_df['tree_density'].fillna(0)
        features_df['avg_dbh'] = features_df['avg_dbh'].fillna(0)
        features_df['std_dbh'] = features_df['std_dbh'].fillna(0)
    
    # Merge cooling proximity
    features_df = features_df.merge(cooling_proximity, on='zipcode', how='left')
    features_df['cooling_site_distance'] = features_df['cooling_site_distance'].fillna(np.inf)
    
    # Compute EJ score
    print("Computing environmental justice scores...")
    # Check if equity_score and population columns exist
    equity_score = features_df['equity_score'] if 'equity_score' in features_df.columns else None
    pop_density = features_df['population'] if 'population' in features_df.columns else None
    
    # Debug: print what we have
    print(f"  Indoor complaints: {features_df['indoor_complaints'].notna().sum()} non-null values")
    print(f"  HVI: {features_df['heat_vulnerability_index'].notna().sum()} non-null values")
    if equity_score is not None:
        print(f"  Equity score: {equity_score.notna().sum()} non-null values, range: {equity_score.min():.3f} - {equity_score.max():.3f}")
    else:
        print(f"  Equity score: Not available")
    if pop_density is not None:
        print(f"  Population: {pop_density.notna().sum()} non-null values")
    else:
        print(f"  Population: Not available")
    
    features_df['ej_score'] = compute_ej_score(
        features_df['indoor_complaints'],
        features_df['heat_vulnerability_index'],
        equity_score=equity_score,
        pop_density=pop_density
    )
    
    print(f"  EJ scores computed: {features_df['ej_score'].notna().sum()} non-null, range: {features_df['ej_score'].min():.4f} - {features_df['ej_score'].max():.4f}")

    # Compute priority scores
    print("Computing priority scores...")
    features_df = compute_priority_scores(features_df)

    # Add placeholder features for model
    features_df['building_density'] = 0.5  # Placeholder
    features_df['parks_coverage'] = 0.1  # Placeholder
    features_df['flood_risk'] = 0.2  # Placeholder

    if use_h3:
        # For H3, population density is harder to estimate, use tree density as proxy
        features_df['population_density'] = features_df['tree_density_per_km2'] * 10  # Rough estimate
        features_df['planting_history'] = features_df['tree_count'] / features_df['cell_area_km2']  # Trees per km² as history proxy
    else:
        features_df['population_density'] = features_df['tree_density'] * 1000  # Placeholder
        features_df['planting_history'] = 0  # Placeholder

    # Save features
    if use_h3:
        # For H3 data, save geometry separately and tabular data as parquet
        tabular_df = features_df.drop(columns=['geometry']) if 'geometry' in features_df.columns else features_df
        output_path = OUTPUT_DIR / "h3_features.parquet"
        geo_output_path = OUTPUT_DIR / "h3_features.geojson"
        json_output_path = OUTPUT_DIR / "h3_features.json"

        tabular_df.to_parquet(output_path, index=False)
        print(f"Saved H3 tabular features to {output_path}")

        # Save as JSON for backend (convert NaN to None for JSON compatibility)
        json_df = tabular_df.copy()
        # Replace NaN/NaT with None for JSON serialization
        json_df = json_df.replace({pd.NA: None, pd.NaT: None})
        json_df = json_df.where(pd.notnull(json_df), None)
        # Convert to dict and handle any remaining NaN values
        json_records = json_df.to_dict('records')
        # Clean up any remaining NaN/Inf values in the records
        for record in json_records:
            for key, value in record.items():
                if pd.isna(value) or (isinstance(value, float) and (np.isinf(value) or np.isnan(value))):
                    record[key] = None
        with open(json_output_path, 'w') as f:
            json.dump(json_records, f, indent=2)
        print(f"Saved H3 JSON features to {json_output_path}")

        # Save as GeoJSON for mapping
        if 'geometry' in features_df.columns:
            gdf = gpd.GeoDataFrame(features_df, geometry='geometry', crs='EPSG:4326')
            gdf.to_file(geo_output_path, driver='GeoJSON')
            print(f"Saved H3 GeoJSON features to {geo_output_path}")
    else:
        output_path = OUTPUT_DIR / "zip_features.parquet"
        geo_output_path = OUTPUT_DIR / "zip_features.geojson"

        features_df.to_parquet(output_path, index=False)
        print(f"Saved ZIP features to {output_path}")

        # Save as GeoJSON for mapping
        if 'geometry' in features_df.columns:
            gdf = gpd.GeoDataFrame(features_df, geometry='geometry', crs='EPSG:4326')
            gdf.to_file(geo_output_path, driver='GeoJSON')
            print(f"Saved ZIP GeoJSON features to {geo_output_path}")

    # Save metadata
    metadata = {
        "analysis_type": "h3" if use_h3 else "zip",
        "h3_resolution": h3_resolution if use_h3 else None,
        "n_features": len(features_df),
        "features": list(features_df.columns),
        "timestamp": pd.Timestamp.now().isoformat()
    }

    metadata_path = OUTPUT_DIR / f"{'h3' if use_h3 else 'zip'}_features_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print("Data preparation complete!")
    return features_df


if __name__ == "__main__":
    import sys

    # Parse command line arguments
    use_h3 = len(sys.argv) > 1 and sys.argv[1].lower() == 'h3'
    h3_resolution = int(sys.argv[2]) if len(sys.argv) > 2 else 9

    print(f"Running {'H3' if use_h3 else 'ZIP'} analysis{' (resolution ' + str(h3_resolution) + ')' if use_h3 else ''}")

    features_df = main(use_h3=use_h3, h3_resolution=h3_resolution)

