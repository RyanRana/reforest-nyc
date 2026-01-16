"""H3 hexagonal grid utilities for NYC."""

import h3
import geopandas as gpd
import pandas as pd
from typing import List, Tuple, Dict, Optional
from shapely.geometry import Polygon, Point
import numpy as np
import logging

logger = logging.getLogger(__name__)


def create_h3_grid(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    resolution: int = 9
) -> gpd.GeoDataFrame:
    """
    Create H3 hexagonal grid covering NYC bounding box.
    
    Args:
        min_lat: Minimum latitude
        max_lat: Maximum latitude
        min_lon: Minimum longitude
        max_lon: Maximum longitude
        resolution: H3 resolution (8-10 recommended for NYC)
        
    Returns:
        GeoDataFrame with H3 hexagons as geometries
    """
    logger.info(f"Creating H3 grid at resolution {resolution} for bbox: "
                f"({min_lat}, {min_lon}) to ({max_lat}, {max_lon})")
    
    # Get all hexes covering the bounding box
    hex_ids = set()
    
    # Sample points across the bounding box
    lat_step = (max_lat - min_lat) / 100
    lon_step = (max_lon - min_lon) / 100
    
    for lat in np.arange(min_lat, max_lat + lat_step, lat_step):
        for lon in np.arange(min_lon, max_lon + lon_step, lon_step):
            hex_id = h3.latlng_to_cell(lat, lon, resolution)
            hex_ids.add(hex_id)
    
    # Convert hex IDs to GeoDataFrame
    hex_data = []
    for hex_id in hex_ids:
        # Get hex boundary (returns list of (lat, lon) tuples)
        hex_boundary = h3.cell_to_boundary(hex_id)
        
        # Create polygon (convert to (lon, lat) for shapely)
        coords = [(lon, lat) for lat, lon in hex_boundary]
        polygon = Polygon(coords)
        
        hex_data.append({
            "h3_id": hex_id,
            "geometry": polygon,
            "resolution": resolution
        })
    
    gdf = gpd.GeoDataFrame(hex_data, crs="EPSG:4326")
    
    logger.info(f"Created {len(gdf)} H3 hexagons")
    return gdf


def hex_to_geojson(hex_id: str) -> Dict:
    """
    Convert H3 hex ID to GeoJSON polygon.
    
    Args:
        hex_id: H3 hexagon ID
        
    Returns:
        GeoJSON dictionary
    """
    boundary = h3.cell_to_boundary(hex_id)
    coords = [[lon, lat] for lat, lon in boundary]
    coords.append(coords[0])  # Close polygon
    
    return {
        "type": "Polygon",
        "coordinates": [coords]
    }


def get_hex_center(hex_id: str) -> Tuple[float, float]:
    """
    Get center coordinates of H3 hexagon.
    
    Args:
        hex_id: H3 hexagon ID
        
    Returns:
        Tuple of (lat, lon)
    """
    lat, lon = h3.cell_to_latlng(hex_id)
    return (lat, lon)


def get_hex_area_km2(hex_id: str) -> float:
    """
    Get area of H3 hexagon in square kilometers.
    
    Args:
        hex_id: H3 hexagon ID
        
    Returns:
        Area in km²
    """
    return h3.cell_area(hex_id, unit="km^2")


def validate_h3_id(hex_id: str) -> bool:
    """
    Validate H3 hexagon ID.
    
    Args:
        hex_id: H3 hexagon ID to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        h3.cell_to_latlng(hex_id)
        return True
    except Exception:
        return False
