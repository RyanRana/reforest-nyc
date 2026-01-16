"""
Tree-based temperature mitigation model.

Uses Earth-2 predictions and tree data to model how many trees are needed
to achieve target temperature reductions per H3 cell.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, Tuple
import logging
from pathlib import Path
import h3

logger = logging.getLogger(__name__)


class TreeMitigationModel:
    """
    Model to predict tree requirements for temperature reduction.
    
    Based on research showing:
    - Tree canopy can reduce local temperature by 1-5°C
    - Effect depends on tree density, size, and species
    - Urban heat island mitigation scales with green space coverage
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize tree mitigation model.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config
        
        # Model parameters (based on urban heat island research)
        # Temperature reduction per tree per km² (in °C)
        # Typical range: 0.01-0.05°C per tree per km² depending on tree size
        self.temp_reduction_per_tree = config.get("mitigation", {}).get(
            "temp_reduction_per_tree_km2", 0.02
        )
        
        # Maximum achievable temperature reduction (in °C)
        # Research shows ~2-5°C max reduction from urban greening
        self.max_temp_reduction = config.get("mitigation", {}).get(
            "max_temp_reduction_c", 3.0
        )
        
        # Minimum tree density for measurable effect (trees per km²)
        self.min_tree_density = config.get("mitigation", {}).get(
            "min_tree_density_km2", 10.0
        )
        
        # Saturation point (trees per km²) where additional trees have diminishing returns
        self.saturation_density = config.get("mitigation", {}).get(
            "saturation_tree_density_km2", 500.0
        )
    
    def predict_temperature_reduction(
        self,
        current_tree_count: int,
        hex_area_km2: float,
        current_temp: float
    ) -> float:
        """
        Predict current temperature reduction from existing trees.
        
        Args:
            current_tree_count: Current number of trees in hex
            hex_area_km2: Area of hexagon in km²
            current_temp: Current baseline temperature (°C)
            
        Returns:
            Temperature reduction in °C
        """
        if hex_area_km2 == 0:
            return 0.0
        
        tree_density = current_tree_count / hex_area_km2
        
        # Apply diminishing returns model
        # Linear up to saturation, then logarithmic
        if tree_density < self.min_tree_density:
            reduction = 0.0
        elif tree_density < self.saturation_density:
            # Linear relationship
            effective_density = tree_density - self.min_tree_density
            reduction = effective_density * self.temp_reduction_per_tree
        else:
            # Logarithmic relationship after saturation
            saturation_reduction = (self.saturation_density - self.min_tree_density) * self.temp_reduction_per_tree
            excess_density = tree_density - self.saturation_density
            additional_reduction = saturation_reduction * np.log1p(excess_density / self.saturation_density) * 0.1
            reduction = saturation_reduction + additional_reduction
        
        # Cap at maximum reduction
        reduction = min(reduction, self.max_temp_reduction)
        
        return reduction
    
    def calculate_trees_needed(
        self,
        target_reduction: float,
        current_tree_count: int,
        hex_area_km2: float,
        current_temp: float
    ) -> Dict[str, Any]:
        """
        Calculate how many trees are needed to achieve target temperature reduction.
        
        Args:
            target_reduction: Desired temperature reduction in °C
            current_tree_count: Current number of trees in hex
            hex_area_km2: Area of hexagon in km²
            current_temp: Current baseline temperature (°C)
            
        Returns:
            Dictionary with:
            - trees_needed: Number of additional trees required
            - total_trees_needed: Total trees needed (including existing)
            - current_reduction: Current temperature reduction
            - achievable_reduction: Maximum achievable reduction
            - feasible: Whether target is achievable
        """
        if hex_area_km2 == 0:
            return {
                "trees_needed": 0,
                "total_trees_needed": 0,
                "current_reduction": 0.0,
                "achievable_reduction": 0.0,
                "feasible": False,
                "message": "Invalid hex area"
            }
        
        # Calculate current reduction
        current_reduction = self.predict_temperature_reduction(
            current_tree_count, hex_area_km2, current_temp
        )
        
        # Check if target is achievable
        if target_reduction > self.max_temp_reduction:
            return {
                "trees_needed": float('inf'),
                "total_trees_needed": float('inf'),
                "current_reduction": current_reduction,
                "achievable_reduction": self.max_temp_reduction,
                "feasible": False,
                "message": f"Target reduction ({target_reduction}°C) exceeds maximum achievable ({self.max_temp_reduction}°C)"
            }
        
        # If already at or above target
        if current_reduction >= target_reduction:
            return {
                "trees_needed": 0,
                "total_trees_needed": current_tree_count,
                "current_reduction": current_reduction,
                "achievable_reduction": self.max_temp_reduction,
                "feasible": True,
                "message": f"Target already achieved. Current reduction: {current_reduction:.2f}°C"
            }
        
        # Calculate required tree density
        required_reduction = target_reduction - current_reduction
        
        # Invert the reduction model to get required density
        if required_reduction <= 0:
            required_density = current_tree_count / hex_area_km2
        else:
            # Solve for tree density needed
            # Linear region
            if required_reduction <= (self.saturation_density - self.min_tree_density) * self.temp_reduction_per_tree:
                required_effective_density = required_reduction / self.temp_reduction_per_tree
                required_density = required_effective_density + self.min_tree_density
            else:
                # In logarithmic region - use approximation
                saturation_reduction = (self.saturation_density - self.min_tree_density) * self.temp_reduction_per_tree
                excess_reduction = required_reduction - saturation_reduction
                # Approximate inverse of log relationship
                excess_density = self.saturation_density * (np.exp(excess_reduction / (saturation_reduction * 0.1)) - 1)
                required_density = self.saturation_density + excess_density
        
        # Calculate trees needed
        current_density = current_tree_count / hex_area_km2 if hex_area_km2 > 0 else 0
        required_trees = int(np.ceil(required_density * hex_area_km2))
        trees_needed = max(0, required_trees - current_tree_count)
        
        # Verify the calculation
        total_trees = current_tree_count + trees_needed
        predicted_reduction = self.predict_temperature_reduction(
            total_trees, hex_area_km2, current_temp
        )
        
        return {
            "trees_needed": trees_needed,
            "total_trees_needed": total_trees,
            "current_reduction": current_reduction,
            "predicted_reduction": predicted_reduction,
            "achievable_reduction": self.max_temp_reduction,
            "feasible": True,
            "current_tree_density": current_density,
            "required_tree_density": required_density,
            "message": f"Need {trees_needed} additional trees to achieve {target_reduction:.2f}°C reduction"
        }
    
    def predict_temperature_with_trees(
        self,
        hex_id: str,
        additional_trees: int,
        earth2_predictions: pd.DataFrame,
        tree_stats: Optional[pd.DataFrame] = None
    ) -> Dict[str, Any]:
        """
        Predict new temperature after adding X trees to a hex cell.
        
        Args:
            hex_id: H3 hexagon ID
            additional_trees: Number of trees to add
            earth2_predictions: DataFrame with Earth-2 temperature predictions
            tree_stats: Optional DataFrame with tree statistics per hex
            
        Returns:
            Dictionary with:
            - baseline_temp: Temperature from Earth-2 (no trees)
            - current_temp: Temperature with current trees
            - new_temp: Temperature after adding trees
            - current_tree_count: Current number of trees
            - new_tree_count: Total trees after addition
            - temperature_reduction: Cooling effect from all trees
            - additional_reduction: Additional cooling from new trees
        """
        # Get hex center and area
        lat, lon = h3.cell_to_latlng(hex_id)
        hex_area_km2 = h3.cell_area(hex_id, unit="km^2")
        
        # Get baseline temperature from Earth-2
        hex_predictions = earth2_predictions[earth2_predictions["h3_id"] == hex_id]
        
        if hex_predictions.empty:
            return {
                "hex_id": hex_id,
                "error": "No Earth-2 predictions found for this hex",
                "success": False
            }
        
        baseline_temp = hex_predictions["temperature_c"].mean()
        
        # Get current tree count
        current_tree_count = 0
        if tree_stats is not None:
            hex_tree_data = tree_stats[tree_stats["h3_id"] == hex_id]
            if not hex_tree_data.empty:
                current_tree_count = int(hex_tree_data["tree_count"].iloc[0])
        
        # Calculate current reduction
        current_reduction = self.predict_temperature_reduction(
            current_tree_count, hex_area_km2, baseline_temp
        )
        
        # Calculate new reduction with additional trees
        new_tree_count = current_tree_count + additional_trees
        new_reduction = self.predict_temperature_reduction(
            new_tree_count, hex_area_km2, baseline_temp
        )
        
        # Calculate temperatures
        current_temp = baseline_temp - current_reduction
        new_temp = baseline_temp - new_reduction
        additional_reduction = new_reduction - current_reduction
        
        result = {
            "hex_id": hex_id,
            "lat": lat,
            "lon": lon,
            "hex_area_km2": hex_area_km2,
            "baseline_temp_c": baseline_temp,
            "current_tree_count": current_tree_count,
            "trees_added": additional_trees,
            "new_tree_count": new_tree_count,
            "current_tree_density_km2": current_tree_count / hex_area_km2 if hex_area_km2 > 0 else 0,
            "new_tree_density_km2": new_tree_count / hex_area_km2 if hex_area_km2 > 0 else 0,
            "current_reduction_c": current_reduction,
            "additional_reduction_c": additional_reduction,
            "total_reduction_c": new_reduction,
            "current_temp_c": current_temp,
            "new_temp_c": new_temp,
            "temp_change_c": new_temp - current_temp,
            "success": True,
            "earth2_forecast_horizons": sorted(hex_predictions["forecast_horizon_years"].unique().tolist()),
            "temperature_range": {
                "min": float(hex_predictions["temperature_c"].min()),
                "max": float(hex_predictions["temperature_c"].max()),
                "mean": float(hex_predictions["temperature_c"].mean()),
                "std": float(hex_predictions["temperature_c"].std())
            }
        }
        
        return result
    
    def analyze_hex_with_earth2(
        self,
        hex_id: str,
        target_reduction: float,
        earth2_predictions: pd.DataFrame,
        tree_stats: Optional[pd.DataFrame] = None
    ) -> Dict[str, Any]:
        """
        Analyze H3 hex using Earth-2 predictions and tree data.
        
        Args:
            hex_id: H3 hexagon ID
            target_reduction: Target temperature reduction in °C
            earth2_predictions: DataFrame with Earth-2 temperature predictions
            tree_stats: Optional DataFrame with tree statistics per hex
            
        Returns:
            Analysis results dictionary
        """
        # Get hex center and area
        lat, lon = h3.cell_to_latlng(hex_id)
        hex_area_km2 = h3.cell_area(hex_id, unit="km^2")
        
        # Get current/future temperature from Earth-2 predictions
        hex_predictions = earth2_predictions[earth2_predictions["h3_id"] == hex_id]
        
        if hex_predictions.empty:
            return {
                "hex_id": hex_id,
                "error": "No Earth-2 predictions found for this hex",
                "feasible": False
            }
        
        # Use average temperature across all forecast horizons
        current_temp = hex_predictions["temperature_c"].mean()
        
        # Get current tree count
        current_tree_count = 0
        if tree_stats is not None:
            hex_tree_data = tree_stats[tree_stats["h3_id"] == hex_id]
            if not hex_tree_data.empty:
                current_tree_count = int(hex_tree_data["tree_count"].iloc[0])
        
        # Calculate trees needed
        mitigation_result = self.calculate_trees_needed(
            target_reduction=target_reduction,
            current_tree_count=current_tree_count,
            hex_area_km2=hex_area_km2,
            current_temp=current_temp
        )
        
        # Combine results
        result = {
            "hex_id": hex_id,
            "lat": lat,
            "lon": lon,
            "hex_area_km2": hex_area_km2,
            "current_temperature_c": current_temp,
            "current_tree_count": current_tree_count,
            "target_reduction_c": target_reduction,
            **mitigation_result,
            "earth2_forecast_horizons": sorted(hex_predictions["forecast_horizon_years"].unique().tolist()),
            "temperature_range": {
                "min": float(hex_predictions["temperature_c"].min()),
                "max": float(hex_predictions["temperature_c"].max()),
                "mean": float(hex_predictions["temperature_c"].mean()),
                "std": float(hex_predictions["temperature_c"].std())
            }
        }
        
        return result
