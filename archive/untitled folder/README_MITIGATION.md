# Tree Mitigation Analysis

This module calculates how many trees are needed to achieve target temperature reductions in NYC H3 hexagons using NVIDIA Earth-2 climate predictions.

## Overview

The tree mitigation model uses:
- **Earth-2 Predictions**: Temperature forecasts from NVIDIA Earth-2 models
- **Tree Census Data**: Current tree counts per H3 hexagon
- **Mitigation Model**: Physics-based model relating tree density to temperature reduction

## Model Parameters

The mitigation model is based on urban heat island research and can be configured in `config.yaml`:

```yaml
mitigation:
  temp_reduction_per_tree_km2: 0.02  # °C per tree per km²
  max_temp_reduction_c: 3.0        # Maximum achievable reduction
  min_tree_density_km2: 10.0         # Minimum density for effect
  saturation_tree_density_km2: 500.0 # Saturation point
```

## Usage

### Single Hex Analysis

```bash
python tree_mitigation_cli.py --h3_id 892a10726d7ffff --target_reduction 2.0
```

### Multiple Hexes

```bash
python tree_mitigation_cli.py \
  --h3_ids 892a10726d7ffff 892a10731b3ffff 892a10093dbffff \
  --target_reduction 1.5
```

### Using Cached Predictions

```bash
python tree_mitigation_cli.py \
  --h3_id 892a10726d7ffff \
  --target_reduction 2.0 \
  --use_cached_predictions
```

### Custom Output

```bash
python tree_mitigation_cli.py \
  --h3_id 892a10726d7ffff \
  --target_reduction 2.0 \
  --output results.json
```

## Output

The analysis provides:

- **Current State**:
  - Current temperature (°C)
  - Current tree count
  - Current temperature reduction from existing trees

- **Requirements**:
  - Trees needed to achieve target reduction
  - Total trees required (including existing)
  - Whether target is feasible

- **Predictions**:
  - Predicted temperature reduction with required trees
  - Tree density requirements

## Example Output

```
============================================================
Analysis for H3 Hex: 892a10726d7ffff
============================================================
Location: (40.7853, -74.0471)
Hex Area: 0.1060 km²
Current Temperature: 13.09°C
Current Tree Count: 0
Current Temperature Reduction: 0.00°C

Target Reduction: 2.0°C
Trees Needed: 12
Total Trees Required: 12
Feasible: True
Message: Need 12 additional trees to achieve 2.00°C reduction
Predicted Reduction: 2.06°C
============================================================
```

## Model Details

### Temperature Reduction Model

The model uses a diminishing returns approach:

1. **Linear Region** (10-500 trees/km²):
   - Temperature reduction = (density - min_density) × reduction_per_tree
   - Typical: 0.02°C per tree per km²

2. **Saturation Region** (>500 trees/km²):
   - Logarithmic relationship
   - Diminishing returns for additional trees

3. **Maximum Cap**:
   - Maximum achievable reduction: 3.0°C (configurable)

### Integration with Earth-2

The model uses Earth-2 predictions to:
- Get baseline temperature for each hex
- Account for future climate conditions
- Provide temperature context for mitigation planning

## Programmatic Usage

```python
from models import TreeMitigationModel
from data import Earth2Predictor
import pandas as pd

# Initialize models
config = load_config()
mitigation_model = TreeMitigationModel(config)
earth2_predictor = Earth2Predictor(config)

# Get predictions
predictions = earth2_predictor.predict_for_h3_hex(
    hex_id="892a10726d7ffff",
    forecast_years=[1, 5, 10]
)

# Analyze mitigation
result = mitigation_model.analyze_hex_with_earth2(
    hex_id="892a10726d7ffff",
    target_reduction=2.0,
    earth2_predictions=predictions,
    tree_stats=tree_stats_df
)

print(f"Trees needed: {result['trees_needed']}")
```

## Research Basis

The model parameters are based on:
- Urban heat island mitigation studies
- Tree canopy cooling effects (1-5°C typical)
- Green space coverage research
- NYC-specific urban forestry studies

## Limitations

- Model assumes uniform tree distribution
- Does not account for tree species or size variation
- Simplified relationship (real-world effects vary)
- Maximum reduction capped at 3°C (research-based)

## Future Enhancements

- Species-specific cooling effects
- Tree size/maturity modeling
- Seasonal variation in cooling
- Integration with actual Earth-2 model runs (when available)
