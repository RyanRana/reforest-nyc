"""Spatial aggregation of data per H3 hexagon."""

import geopandas as gpd
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, List
import h3
import logging
from tqdm import tqdm

logger = logging.getLogger(__name__)


class SpatialAggregator:
    """Aggregate spatial data per H3 hexagon."""
    
    def __init__(self, config: Dict[str, Any], cache_dir: Path):
        """
        Initialize spatial aggregator.
        
        Args:
            config: Configuration dictionary
            cache_dir: Directory for caching aggregated data
        """
        self.config = config
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.h3_resolution = config["h3"]["default_resolution"]
    
    def aggregate_trees_per_hex(
        self,
        h3_grid: gpd.GeoDataFrame,
        tree_data: gpd.GeoDataFrame
    ) -> pd.DataFrame:
        """
        Aggregate tree count and canopy cover per H3 hex.
        
        Args:
            h3_grid: GeoDataFrame with H3 hexagons
            tree_data: GeoDataFrame with tree locations
            
        Returns:
            DataFrame with tree statistics per hex
        """
        logger.info("Aggregating tree data per H3 hexagon...")
        
        # Spatial join: trees within hexes
        tree_hex_join = gpd.sjoin(
            tree_data,
            h3_grid,
            how="inner",
            predicate="within"
        )
        
        # Aggregate statistics per hex
        tree_stats = tree_hex_join.groupby("h3_id").agg({
            "geometry": "count"  # Tree count
        }).rename(columns={"geometry": "tree_count"})
        
        # Calculate tree density (trees per km²)
        tree_stats["tree_density"] = tree_stats["tree_count"].copy()
        
        # Add hex area for density calculation
        tree_stats["hex_area_km2"] = tree_stats.index.map(
            lambda hex_id: h3.cell_area(hex_id, unit="km^2")
        )
        tree_stats["tree_density"] = (
            tree_stats["tree_count"] / tree_stats["hex_area_km2"]
        )
        
        # If tree data has diameter or canopy info, aggregate that too
        if "tree_dbh" in tree_hex_join.columns:
            canopy_stats = tree_hex_join.groupby("h3_id").agg({
                "tree_dbh": ["mean", "sum"]
            })
            canopy_stats.columns = ["avg_tree_dbh", "total_tree_dbh"]
            tree_stats = tree_stats.join(canopy_stats)
        
        logger.info(f"Aggregated tree data for {len(tree_stats)} hexagons")
        return tree_stats.reset_index()
    
    def aggregate_green_space_per_hex(
        self,
        h3_grid: gpd.GeoDataFrame,
        ndvi_data: Optional[gpd.GeoDataFrame]
    ) -> pd.DataFrame:
        """
        Aggregate green space / NDVI per H3 hex.
        
        Args:
            h3_grid: GeoDataFrame with H3 hexagons
            ndvi_data: GeoDataFrame with NDVI raster data (optional)
            
        Returns:
            DataFrame with green space statistics per hex
        """
        logger.info("Aggregating green space data per H3 hexagon...")
        
        if ndvi_data is None:
            logger.warning("No NDVI data provided. Returning empty green space stats.")
            green_stats = pd.DataFrame({
                "h3_id": h3_grid["h3_id"],
                "ndvi_mean": np.nan,
                "ndvi_std": np.nan,
                "green_fraction": np.nan
            })
            return green_stats
        
        # Spatial join: NDVI pixels within hexes
        ndvi_hex_join = gpd.sjoin(
            ndvi_data,
            h3_grid,
            how="inner",
            predicate="within"
        )
        
        # Aggregate NDVI statistics per hex
        if "ndvi" in ndvi_hex_join.columns:
            green_stats = ndvi_hex_join.groupby("h3_id").agg({
                "ndvi": ["mean", "std"]
            })
            green_stats.columns = ["ndvi_mean", "ndvi_std"]
            
            # Calculate green fraction (NDVI > 0.3 threshold)
            green_pixels = ndvi_hex_join[ndvi_hex_join["ndvi"] > 0.3].groupby("h3_id").size()
            total_pixels = ndvi_hex_join.groupby("h3_id").size()
            green_stats["green_fraction"] = (green_pixels / total_pixels).fillna(0)
        else:
            green_stats = pd.DataFrame(index=h3_grid["h3_id"])
            green_stats["ndvi_mean"] = np.nan
            green_stats["ndvi_std"] = np.nan
            green_stats["green_fraction"] = np.nan
        
        logger.info(f"Aggregated green space data for {len(green_stats)} hexagons")
        return green_stats.reset_index()
    
    def aggregate_temperature_per_hex(
        self,
        h3_grid: gpd.GeoDataFrame,
        temperature_data: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Aggregate historical temperature data per H3 hex.
        
        Args:
            h3_grid: GeoDataFrame with H3 hexagons
            temperature_data: DataFrame with temperature measurements
                (must have 'lat', 'lon', 'temperature', 'date' columns)
            
        Returns:
            DataFrame with temperature statistics per hex
        """
        logger.info("Aggregating temperature data per H3 hexagon...")
        
        # Convert temperature data to GeoDataFrame if needed
        if not isinstance(temperature_data, gpd.GeoDataFrame):
            if "lat" in temperature_data.columns and "lon" in temperature_data.columns:
                temp_gdf = gpd.GeoDataFrame(
                    temperature_data,
                    geometry=gpd.points_from_xy(
                        temperature_data["lon"],
                        temperature_data["lat"]
                    ),
                    crs="EPSG:4326"
                )
            else:
                logger.warning("Temperature data missing lat/lon columns")
                return pd.DataFrame({"h3_id": h3_grid["h3_id"]})
        else:
            temp_gdf = temperature_data
        
        # Spatial join: temperature points within hexes
        temp_hex_join = gpd.sjoin(
            temp_gdf,
            h3_grid,
            how="inner",
            predicate="within"
        )
        
        # Aggregate temperature statistics per hex and time
        if "temperature" in temp_hex_join.columns:
            temp_stats = temp_hex_join.groupby(["h3_id", "date"]).agg({
                "temperature": ["mean", "min", "max", "std"]
            })
            temp_stats.columns = ["temp_mean", "temp_min", "temp_max", "temp_std"]
            temp_stats = temp_stats.reset_index()
        else:
            logger.warning("Temperature data missing 'temperature' column")
            temp_stats = pd.DataFrame({"h3_id": h3_grid["h3_id"]})
        
        logger.info(f"Aggregated temperature data for {len(temp_stats)} hex-time combinations")
        return temp_stats
    
    def create_feature_dataframe(
        self,
        h3_grid: gpd.GeoDataFrame,
        tree_stats: pd.DataFrame,
        green_stats: pd.DataFrame,
        temp_stats: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Create combined feature DataFrame per H3 hex.
        
        Args:
            h3_grid: GeoDataFrame with H3 hexagons
            tree_stats: Tree statistics per hex
            green_stats: Green space statistics per hex
            temp_stats: Temperature statistics per hex (and time if available)
            
        Returns:
            Combined feature DataFrame
        """
        logger.info("Creating combined feature DataFrame...")
        
        # Start with H3 grid
        features = h3_grid[["h3_id", "resolution"]].copy()
        
        # Add hex center coordinates
        features["lat"] = features["h3_id"].map(
            lambda hex_id: h3.cell_to_latlng(hex_id)[0]
        )
        features["lon"] = features["h3_id"].map(
            lambda hex_id: h3.cell_to_latlng(hex_id)[1]
        )
        
        # Add hex area
        features["hex_area_km2"] = features["h3_id"].map(
            lambda hex_id: h3.cell_area(hex_id, unit="km^2")
        )
        
        # Merge tree statistics
        if not tree_stats.empty:
            features = features.merge(tree_stats, on="h3_id", how="left")
        else:
            features["tree_count"] = 0
            features["tree_density"] = 0.0
        
        # Merge green space statistics
        if not green_stats.empty:
            features = features.merge(green_stats, on="h3_id", how="left")
        else:
            features["ndvi_mean"] = np.nan
            features["ndvi_std"] = np.nan
            features["green_fraction"] = 0.0
        
        # Merge temperature statistics (if time-indexed, take latest or mean)
        if not temp_stats.empty:
            if "date" in temp_stats.columns:
                # Use most recent temperature data
                latest_temp = temp_stats.sort_values("date").groupby("h3_id").last()
                features = features.merge(
                    latest_temp[["temp_mean", "temp_min", "temp_max", "temp_std"]],
                    left_on="h3_id",
                    right_index=True,
                    how="left"
                )
            else:
                features = features.merge(temp_stats, on="h3_id", how="left")
        else:
            features["temp_mean"] = np.nan
            features["temp_min"] = np.nan
            features["temp_max"] = np.nan
            features["temp_std"] = np.nan
        
        # Fill NaN values
        numeric_cols = features.select_dtypes(include=[np.number]).columns
        features[numeric_cols] = features[numeric_cols].fillna(0)
        
        logger.info(f"Created feature DataFrame with {len(features)} hexagons and "
                   f"{len(features.columns)} features")
        
        return features
