"""Visualization utilities for H3 hexagons and predictions."""

import folium
import geopandas as gpd
import pandas as pd
import numpy as np
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


def create_h3_choropleth(
    gdf: gpd.GeoDataFrame,
    value_column: str,
    output_file: str = "h3_map.html",
    center_lat: float = 40.7128,
    center_lon: float = -73.9352,
    zoom_start: int = 11,
    color_scheme: str = "YlOrRd"
) -> folium.Map:
    """
    Create interactive folium map with H3 hexagon choropleth.
    
    Args:
        gdf: GeoDataFrame with H3 hexagons and values
        value_column: Column name to visualize
        output_file: Output HTML file path
        center_lat: Map center latitude
        center_lon: Map center longitude
        zoom_start: Initial zoom level
        color_scheme: ColorBrewer scheme name
        
    Returns:
        Folium map object
    """
    logger.info(f"Creating H3 choropleth map for {value_column}...")
    
    # Create base map
    m = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=zoom_start,
        tiles="OpenStreetMap"
    )
    
    # Add H3 hexagons
    for idx, row in gdf.iterrows():
        if pd.isna(row[value_column]):
            continue
        
        # Create popup text
        popup_text = f"""
        <b>H3 ID:</b> {row.get('h3_id', 'N/A')}<br>
        <b>{value_column}:</b> {row[value_column]:.2f}
        """
        
        # Add polygon to map
        folium.GeoJson(
            row.geometry.__geo_interface__,
            style_function=lambda feature, val=row[value_column]: {
                "fillColor": _get_color(val, gdf[value_column], color_scheme),
                "color": "black",
                "weight": 1,
                "fillOpacity": 0.7
            },
            popup=folium.Popup(popup_text, max_width=200)
        ).add_to(m)
    
    # Add colorbar legend (simplified)
    m.add_child(folium.map.LayerControl())
    
    # Save map
    m.save(output_file)
    logger.info(f"Saved map to {output_file}")
    
    return m


def _get_color(value: float, series: pd.Series, scheme: str) -> str:
    """Get color for value based on color scheme."""
    # Simple color mapping (can be enhanced with ColorBrewer)
    if pd.isna(value):
        return "gray"
    
    min_val = series.min()
    max_val = series.max()
    
    if max_val == min_val:
        return "blue"
    
    normalized = (value - min_val) / (max_val - min_val)
    
    # Simple YlOrRd scheme
    if scheme == "YlOrRd":
        if normalized < 0.33:
            return "#ffffcc"  # Yellow
        elif normalized < 0.66:
            return "#fecc5c"  # Orange
        else:
            return "#e31a1c"  # Red
    else:
        # Default: blue scale
        return f"#{int(255 * (1 - normalized)):02x}{int(255 * normalized):02x}ff"


def visualize_predictions(
    predictions: pd.DataFrame,
    h3_grid: gpd.GeoDataFrame,
    output_file: str = "predictions_map.html"
) -> folium.Map:
    """
    Visualize temperature predictions on H3 hexagon map.
    
    Args:
        predictions: DataFrame with predictions (must have 'h3_id' and 'temperature_c')
        h3_grid: GeoDataFrame with H3 hexagons
        output_file: Output HTML file path
        
    Returns:
        Folium map object
    """
    logger.info("Visualizing temperature predictions...")
    
    # Merge predictions with H3 grid
    if "h3_id" in predictions.columns:
        # Aggregate predictions per hex (e.g., mean temperature)
        pred_agg = predictions.groupby("h3_id")["temperature_c"].mean().reset_index()
        gdf = h3_grid.merge(pred_agg, on="h3_id", how="left")
        value_column = "temperature_c"
    else:
        logger.warning("Predictions missing 'h3_id' column")
        gdf = h3_grid
        value_column = None
    
    if value_column:
        return create_h3_choropleth(
            gdf,
            value_column,
            output_file=output_file
        )
    else:
        # Fallback: just show hex grid
        m = folium.Map(
            location=[40.7128, -73.9352],
            zoom_start=11
        )
        for idx, row in gdf.iterrows():
            folium.GeoJson(
                row.geometry.__geo_interface__,
                style_function=lambda feature: {
                    "fillColor": "blue",
                    "color": "black",
                    "weight": 1,
                    "fillOpacity": 0.3
                }
            ).add_to(m)
        m.save(output_file)
        return m
