# Quick Start: Adding Trees and Predicting Temperature

## Overview

You can now predict what the temperature will be if you add X trees to any H3 hex cell in NYC!

## How It Works

The system combines:
1. **NVIDIA Earth-2 Model** → Predicts baseline temperature (weather/climate)
2. **Tree Mitigation Model** → Calculates cooling effect from trees
3. **Result** → Temperature = Baseline - Cooling from trees

## Usage

### Simple Example: Add trees to one hex

```bash
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 50
```

### Multiple Hex Cells

```bash
python add_trees_cli.py --h3_ids 892a10726d7ffff 892a1072697ffff --add_trees 25
```

### Use Cached Predictions (faster)

```bash
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 100 --use_cached_predictions
```

### Save to Custom File

```bash
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 75 --output my_results.csv
```

## Example Output

```
================================================================================
TEMPERATURE PREDICTION: Adding 50 trees per hex
================================================================================

Hex ID: 892a10726d7ffff
  Location: (40.7853, -74.0471)
  Area: 0.1060 km²

  Current State:
    • Trees: 0
    • Tree Density: 0.0 trees/km²
    • Temperature: 13.06°C

  After Adding 50 Trees:
    • Total Trees: 50
    • Tree Density: 471.8 trees/km²
    • Temperature: 10.06°C

  Temperature Change:
    • Additional Cooling: 3.000°C
    • Total Cooling: 3.000°C
    • Net Change: -3.000°C

  Earth-2 Baseline: 13.06°C (before any tree effects)
```

## How Tree Cooling Works

The model uses physics-based calculations:

### Formula

- **Tree Density** = Trees / Hex Area (trees/km²)
- **Cooling Effect** depends on density with diminishing returns:
  - **Low density** (< 10 trees/km²): Minimal effect
  - **Medium density** (10-500 trees/km²): Linear cooling (~0.02°C per tree/km²)
  - **High density** (> 500 trees/km²): Logarithmic (diminishing returns)
  - **Maximum cooling**: 3°C (configurable in `config.yaml`)

### Example Scenarios

| Trees Added | Tree Density | Cooling Effect |
|------------|--------------|----------------|
| 10 trees   | 94 trees/km² | 1.69°C        |
| 25 trees   | 236 trees/km²| 3.00°C (max)  |
| 50 trees   | 472 trees/km²| 3.00°C (max)  |
| 100 trees  | 944 trees/km²| 3.00°C (max)  |

*Note: For this hex (0.106 km²), saturation happens around 25 trees*

## Understanding the Results

### Fields in Output CSV

- **hex_id**: H3 hexagon identifier
- **lat, lon**: Geographic coordinates
- **hex_area_km2**: Area of hex in km²
- **baseline_temp_c**: Temperature from Earth-2 (no tree effects)
- **current_tree_count**: Existing trees in hex
- **trees_added**: Number of trees you're adding
- **new_tree_count**: Total trees after addition
- **current_tree_density_km2**: Current trees per km²
- **new_tree_density_km2**: New trees per km²
- **additional_reduction_c**: Extra cooling from new trees
- **total_reduction_c**: Total cooling from all trees
- **current_temp_c**: Current temperature (with existing trees)
- **new_temp_c**: New temperature (after adding trees)
- **temp_change_c**: Temperature difference

## Tips

### 1. Start with Cached Predictions

First run generates predictions for all years (1, 5, 10). Use `--use_cached_predictions` for subsequent runs:

```bash
# First run (generates predictions)
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 20

# Faster subsequent runs
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 40 --use_cached_predictions
```

### 2. Find H3 IDs for Your Area

```python
import h3

# Get H3 ID for a lat/lon
hex_id = h3.latlng_to_cell(40.7580, -73.9855, 9)  # Times Square
print(hex_id)  # '892a1072b47ffff'
```

### 3. Compare Different Scenarios

```bash
# Scenario 1: Small intervention
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 10 --output scenario1.csv

# Scenario 2: Medium intervention
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 25 --output scenario2.csv

# Scenario 3: Large intervention
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 50 --output scenario3.csv
```

## Customize Tree Cooling Parameters

Edit `config.yaml`:

```yaml
mitigation:
  # Cooling per tree per km² (°C)
  temp_reduction_per_tree_km2: 0.02
  
  # Maximum achievable cooling (°C)
  max_temp_reduction_c: 3.0
  
  # Minimum density for effect (trees/km²)
  min_tree_density_km2: 10.0
  
  # Saturation density (trees/km²)
  saturation_tree_density_km2: 500.0
```

## Limitations

1. **Model is deterministic**: Same inputs always give same outputs
2. **Assumes mature trees**: Actual cooling develops over years as trees grow
3. **No species variation**: All trees treated equally (reality: varies by species)
4. **No micro-climate effects**: Doesn't model wind patterns, building shadows, etc.
5. **Earth-2 may use enhanced placeholders**: If GFS data unavailable, uses realistic synthetic data

## Full Workflow Example

```bash
# 1. Generate predictions for a neighborhood
python main.py --min_lat 40.75 --max_lat 40.76 --min_lon -74.01 --max_lon -74.00

# 2. Test adding trees to specific hexes
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 30

# 3. Analyze what cooling is needed
python tree_mitigation_cli.py --h3_id 892a10726d7ffff --target_reduction 2.0

# 4. Compare scenarios
python add_trees_cli.py --h3_ids 892a10726d7ffff 892a1072697ffff --add_trees 50 --output comparison.csv
```

## Questions?

- **"Why is cooling capped at 3°C?"**
  → Based on urban heat island research. Adjust in `config.yaml` if needed.

- **"Can I use real tree data?"**
  → Yes! Run `main.py` first to aggregate tree data, then the tool will use actual tree counts.

- **"How accurate is NVIDIA Earth-2?"**
  → The model is loaded and ready, but may use enhanced placeholders if GFS data is unavailable. See `REALITY_CHECK.md` for details.

- **"What hex resolution should I use?"**
  → Resolution 9 (~0.1 km² per hex) is good for NYC blocks. Resolution 8 (~0.7 km²) for neighborhoods.
