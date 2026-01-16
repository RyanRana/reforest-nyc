"""
H3 Geospatial Utilities for Urban Climate Resilience Analysis
Provides functions for H3-based spatial analysis of tree data and environmental features.
"""

import pandas as pd
import geopandas as gpd
import h3
from shapely.geometry import Polygon, Point
from typing import List, Dict, Tuple, Optional
import numpy as np


def latlng_to_h3_cell(lat: float, lng: float, resolution: int) -> str:
    """Convert latitude/longitude to H3 cell index."""
    return h3.latlng_to_cell(lat, lng, resolution)


def h3_cell_to_latlng(cell: str) -> Tuple[float, float]:
    """Convert H3 cell index to centroid latitude/longitude."""
    return h3.cell_to_latlng(cell)


def h3_cell_to_boundary(cell: str) -> List[Tuple[float, float]]:
    """Get the boundary coordinates of an H3 cell."""
    return h3.cell_to_boundary(cell)


def h3_cell_to_polygon(cell: str) -> Polygon:
    """Convert H3 cell to Shapely Polygon.
    
    Note: h3.cell_to_boundary() returns coordinates in (lat, lon) order,
    but Shapely/GeoJSON expects (lon, lat) order. We swap them here.
    """
    boundary = h3_cell_to_boundary(cell)
    # Swap from (lat, lon) to (lon, lat) for Shapely
    boundary_lonlat = [(lon, lat) for lat, lon in boundary]
    return Polygon(boundary_lonlat)


def h3_cell_area(cell: str, unit: str = 'km2') -> float:
    """Get the area of an H3 cell."""
    area_km2 = h3.cell_area(cell)  # H3 returns area in km² by default
    if unit == 'km2':
        return area_km2
    elif unit == 'm2':
        return area_km2 * 1_000_000  # km² to m²
    else:
        raise ValueError("Unit must be 'm2' or 'km2'")


def get_h3_resolution_for_area(target_area_km2: float) -> int:
    """Find the H3 resolution that gives cells closest to target area."""
    # H3 cell areas in km² for each resolution
    h3_areas = {
        0: 4250546.848,
        1: 607220.978,
        2: 86745.854,
        3: 12392.264,
        4: 1770.323,
        5: 252.903,
        6: 36.129,
        7: 5.161,
        8: 0.737,
        9: 0.105,
        10: 0.015,
        11: 0.002,
        12: 0.0003,
        13: 0.00004,
        14: 0.000006,
        15: 0.0000009
    }

    # Find resolution with area closest to target
    closest_res = min(h3_areas.keys(), key=lambda r: abs(h3_areas[r] - target_area_km2))
    return closest_res


def trees_to_h3_cells(trees_gdf: gpd.GeoDataFrame, resolution: int) -> pd.DataFrame:
    """Convert tree point data to H3 cells with tree counts and statistics."""

    if trees_gdf.empty:
        return pd.DataFrame(columns=['h3_cell', 'tree_count', 'avg_dbh', 'std_dbh',
                                   'min_dbh', 'max_dbh', 'health_pct', 'alive_pct'])

    # Add H3 cell column
    trees_df = pd.DataFrame(trees_gdf.copy())
    trees_df['h3_cell'] = trees_df.apply(
        lambda row: latlng_to_h3_cell(row.geometry.y, row.geometry.x, resolution),
        axis=1
    )

    # Group by H3 cell and compute statistics
    cell_stats = trees_df.groupby('h3_cell').agg({
        'tree_id': 'count',  # Count trees per cell
        'tree_dbh': ['mean', 'std', 'min', 'max'],  # Tree size stats
        'health': lambda x: (x == 'Good').mean() if 'health' in x.name else 0,  # Health percentage
        'status': lambda x: (x == 'Alive').mean() if 'status' in x.name else 0   # Alive percentage
    }).reset_index()

    # Flatten column names
    cell_stats.columns = ['h3_cell', 'tree_count', 'avg_dbh', 'std_dbh',
                         'min_dbh', 'max_dbh', 'health_pct', 'alive_pct']

    # Add cell geometry and area
    cell_stats['geometry'] = cell_stats['h3_cell'].apply(h3_cell_to_polygon)
    cell_stats['cell_area_km2'] = cell_stats['h3_cell'].apply(lambda cell: h3_cell_area(cell, 'km2'))

    # Calculate tree density per cell
    cell_stats['tree_density_per_km2'] = cell_stats['tree_count'] / cell_stats['cell_area_km2']

    # Fill NaN values
    cell_stats['avg_dbh'] = cell_stats['avg_dbh'].fillna(0)
    cell_stats['std_dbh'] = cell_stats['std_dbh'].fillna(0)
    cell_stats['min_dbh'] = cell_stats['min_dbh'].fillna(0)
    cell_stats['max_dbh'] = cell_stats['max_dbh'].fillna(0)
    cell_stats['health_pct'] = cell_stats['health_pct'].fillna(0)
    cell_stats['alive_pct'] = cell_stats['alive_pct'].fillna(0)

    return cell_stats


def create_h3_grid_for_nyc(resolution: int = 9) -> gpd.GeoDataFrame:
    """Create an H3 grid covering NYC area by sampling points."""

    # NYC bounding box (approximate)
    nyc_bounds = {
        'min_lat': 40.4774, 'max_lat': 40.9176,
        'min_lng': -74.2591, 'max_lng': -73.7004
    }

    # Create a grid of sample points across NYC (every ~500m)
    lat_points = []
    lng_points = []

    lat_step = 0.0045  # ~500m in latitude
    lng_step = 0.0055  # ~500m in longitude at NYC latitude

    lat = nyc_bounds['min_lat']
    while lat <= nyc_bounds['max_lat']:
        lng = nyc_bounds['min_lng']
        while lng <= nyc_bounds['max_lng']:
            lat_points.append(lat)
            lng_points.append(lng)
            lng += lng_step
        lat += lat_step

    # Get unique H3 cells from sample points
    h3_cells = set()
    for lat, lng in zip(lat_points, lng_points):
        try:
            cell = latlng_to_h3_cell(lat, lng, resolution)
            h3_cells.add(cell)
        except:
            continue  # Skip invalid coordinates

    # Convert to GeoDataFrame
    grid_data = []
    for cell in h3_cells:
        lat, lng = h3_cell_to_latlng(cell)
        geometry = h3_cell_to_polygon(cell)
        area_km2 = h3_cell_area(cell, 'km2')

        grid_data.append({
            'h3_cell': cell,
            'centroid_lat': lat,
            'centroid_lng': lng,
            'geometry': geometry,
            'area_km2': area_km2
        })

    return gpd.GeoDataFrame(grid_data, geometry='geometry', crs='EPSG:4326')


def find_tree_gaps(h3_tree_data: gpd.GeoDataFrame, threshold_density: float = 5.0) -> List[str]:
    """Identify H3 cells with low tree density (potential planting sites)."""

    gaps = h3_tree_data[h3_tree_data['tree_density_per_km2'] < threshold_density]
    return gaps['h3_cell'].tolist()


def find_tree_clusters(h3_tree_data: gpd.GeoDataFrame, threshold_density: float = 50.0) -> List[str]:
    """Identify H3 cells with high tree density (potential urban forests)."""

    clusters = h3_tree_data[h3_tree_data['tree_density_per_km2'] >= threshold_density]
    return clusters['h3_cell'].tolist()


def get_adjacent_cells(cell: str, rings: int = 1) -> List[str]:
    """Get adjacent H3 cells within specified ring distance."""

    return h3.grid_ring(cell, rings)


def prioritize_planting_sites(gap_cells: List[str], existing_clusters: List[str],
                            environmental_data: Optional[gpd.GeoDataFrame] = None) -> List[Tuple[str, float]]:
    """Prioritize planting sites based on proximity to existing trees and environmental factors."""

    priorities = []

    for gap_cell in gap_cells:
        # Base priority: proximity to existing tree clusters
        proximity_score = 0

        # Check if adjacent to existing clusters
        neighbors = get_adjacent_cells(gap_cell, rings=1)
        adjacent_clusters = [n for n in neighbors if n in existing_clusters]

        if adjacent_clusters:
            proximity_score = 1.0  # High priority if adjacent to clusters
        else:
            # Check 2-ring neighbors
            neighbors_2 = get_adjacent_cells(gap_cell, rings=2)
            nearby_clusters = [n for n in neighbors_2 if n in existing_clusters]
            if nearby_clusters:
                proximity_score = 0.5  # Medium priority if within 2 rings

        # Environmental factors (if provided)
        env_score = 0
        if environmental_data is not None:
            cell_data = environmental_data[environmental_data['h3_cell'] == gap_cell]
            if not cell_data.empty:
                # Higher priority for areas with heat vulnerability and air quality issues
                heat_score = cell_data.get('heat_score', 0).iloc[0] if 'heat_score' in cell_data.columns else 0
                air_score = cell_data.get('air_quality_score', 0).iloc[0] if 'air_quality_score' in cell_data.columns else 0
                env_score = (heat_score + air_score) / 2

        # Combined priority score
        total_priority = proximity_score * 0.6 + env_score * 0.4
        priorities.append((gap_cell, total_priority))

    # Sort by priority (highest first)
    priorities.sort(key=lambda x: x[1], reverse=True)
    return priorities


def h3_cells_to_zip_mapping(h3_cells: List[str], zip_gdf: gpd.GeoDataFrame) -> Dict[str, str]:
    """Map H3 cells to ZIP codes for compatibility with existing systems."""

    mapping = {}

    for cell in h3_cells:
        cell_poly = h3_cell_to_polygon(cell)
        cell_gdf = gpd.GeoDataFrame({'h3_cell': [cell], 'geometry': [cell_poly]}, crs='EPSG:4326')

        # Find intersecting ZIP codes
        intersections = gpd.overlay(cell_gdf, zip_gdf, how='intersection')
        if not intersections.empty:
            # Assign to ZIP with largest intersection area
            intersections['area'] = intersections.geometry.area
            best_zip = intersections.loc[intersections['area'].idxmax(), 'zipcode']
            mapping[cell] = best_zip

    return mapping


def aggregate_h3_to_zip(h3_data: gpd.GeoDataFrame, zip_gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Aggregate H3-level data to ZIP code level for compatibility."""

    # Create mapping
    cell_to_zip = h3_cells_to_zip_mapping(h3_data['h3_cell'].tolist(), zip_gdf)

    # Add ZIP mapping to H3 data
    h3_data_with_zip = h3_data.copy()
    h3_data_with_zip['zipcode'] = h3_data_with_zip['h3_cell'].map(cell_to_zip)

    # Aggregate by ZIP
    zip_aggregated = h3_data_with_zip.groupby('zipcode').agg({
        'tree_count': 'sum',
        'tree_density_per_km2': 'mean',  # Average density across cells
        'avg_dbh': 'mean',
        'health_pct': 'mean',
        'alive_pct': 'mean',
        'cell_area_km2': 'sum'  # Total area covered by cells in ZIP
    }).reset_index()

    # Merge with ZIP geometries
    zip_result = zip_gdf.merge(zip_aggregated, on='zipcode', how='left')

    # Fill missing values
    zip_result['tree_count'] = zip_result['tree_count'].fillna(0)
    zip_result['tree_density_per_km2'] = zip_result['tree_density_per_km2'].fillna(0)
    zip_result['avg_dbh'] = zip_result['avg_dbh'].fillna(0)
    zip_result['health_pct'] = zip_result['health_pct'].fillna(0)
    zip_result['alive_pct'] = zip_result['alive_pct'].fillna(0)
    zip_result['cell_area_km2'] = zip_result['cell_area_km2'].fillna(0)

    return zip_result
