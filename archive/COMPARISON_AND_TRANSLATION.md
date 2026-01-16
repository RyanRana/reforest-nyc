# Comparison: Untitled Folder vs Urban Futures

## Executive Summary

**Untitled Folder** is **better for scientific accuracy and physics-based predictions**, while **Urban Futures** is **better for policy/planning and cost-benefit analysis**. They serve different purposes and can complement each other.

## Detailed Comparison

### 1. Computational Approach

#### Untitled Folder (Physics-Based)
- **Core Model**: NVIDIA Earth-2 AI weather model (DLWP)
- **Method**: Physics-based climate simulation + tree cooling physics
- **Approach**: 
  - Uses actual atmospheric data → runs physics simulation → predicts temperature
  - Applies tree cooling model based on urban heat island research
  - Accounts for diminishing returns and saturation effects
- **Accuracy**: Higher scientific accuracy, based on actual climate physics
- **Output**: Temperature predictions in °C with cooling effects

#### Urban Futures (Data-Driven)
- **Core Model**: Machine learning (Random Forest) trained on features
- **Method**: Feature engineering + priority scoring + impact prediction
- **Approach**:
  - Aggregates multiple datasets (HVI, air quality, fuel oil, complaints)
  - Computes priority scores with environmental justice weighting
  - Predicts "impact per dollar" using trained ML model
- **Accuracy**: Good for relative prioritization, less accurate for absolute temperature
- **Output**: Priority scores, impact per dollar, recommended tree counts

### 2. Spatial Resolution

#### Untitled Folder
- **Grid**: H3 hexagonal cells (resolution 9 = ~0.1 km² per hex)
- **Granularity**: Block-level precision
- **Coverage**: Can analyze any H3 hex in NYC
- **Flexibility**: Can work at different H3 resolutions

#### Urban Futures
- **Grid**: H3 hexagonal cells (resolution 9) OR ZIP codes
- **Granularity**: Block-level (H3) or neighborhood-level (ZIP)
- **Coverage**: All NYC ZIP codes or H3 cells
- **Flexibility**: Can switch between H3 and ZIP analysis

### 3. Data Sources

#### Untitled Folder
- NYC Street Tree Census (683,788 trees)
- NOAA temperature data
- NVIDIA Earth-2 AI model
- Optional: NDVI/green space data

#### Urban Futures
- NYC Street Tree Census (683,788 trees)
- Heat Vulnerability Index (HVI)
- Air Quality (PM2.5, NO2)
- Fuel Oil Usage
- Indoor Environmental Complaints (311)
- Cooling Sites
- Equity Score (congressional data)
- Population Density

### 4. Key Features

#### Untitled Folder Strengths
✅ **Scientific Accuracy**: Uses real climate physics (Earth-2)
✅ **Temperature Prediction**: Actual °C predictions with tree effects
✅ **Forward-Looking**: Can forecast 1, 5, 10 years ahead
✅ **Interactive CLI**: "Add X trees → get temperature" workflow
✅ **Physics-Based**: Cooling model based on research, not just correlations

#### Urban Futures Strengths
✅ **Policy-Relevant**: Impact per dollar, priority scores
✅ **Multi-Factor Analysis**: Combines heat, air quality, equity, pollution
✅ **Environmental Justice**: Explicit EJ scoring and weighting
✅ **Web Interface**: Full-stack dashboard with Mapbox visualization
✅ **Cost-Benefit**: Optimizes for impact per dollar invested

### 5. Use Cases

#### When to Use Untitled Folder
- **Scientific research**: Need accurate temperature predictions
- **Climate modeling**: Want to understand future climate scenarios
- **What-if analysis**: "What if we plant 50 trees here?"
- **Temperature-focused**: Primary concern is cooling effects
- **Physics validation**: Need to verify against climate models

#### When to Use Urban Futures
- **Policy planning**: Need to prioritize planting locations
- **Budget allocation**: Want to maximize impact per dollar
- **Environmental justice**: Need to prioritize EJ communities
- **Multi-objective**: Care about heat, air quality, equity together
- **Public engagement**: Need web dashboard for stakeholders

## Data Translation Guide

### Converting Untitled Folder → Urban Futures

#### Step 1: Extract Temperature Predictions
```python
# From untitled folder results
import pandas as pd

# Load untitled folder predictions
untitled_results = pd.read_csv('untitled folder/data/processed/FINAL_REAL_RESULTS.csv')

# Extract key columns
temperature_data = untitled_results[[
    'hex_id', 'lat', 'lon', 'current_temperature_c', 
    'current_tree_count', 'current_reduction'
]].copy()

# Rename to match urban futures format
temperature_data = temperature_data.rename(columns={
    'hex_id': 'h3_cell',
    'current_temperature_c': 'baseline_temp_c',
    'current_reduction': 'tree_cooling_c'
})
```

#### Step 2: Map to H3 Features
```python
# Load urban futures H3 features
urban_futures_features = pd.read_parquet('urban futures/data/models/h3_features.parquet')

# Merge temperature data
merged = urban_futures_features.merge(
    temperature_data,
    on='h3_cell',
    how='left'
)

# Add temperature-based priority adjustment
# Higher temperature = higher priority
merged['temp_priority'] = (merged['baseline_temp_c'] - merged['baseline_temp_c'].min()) / \
                          (merged['baseline_temp_c'].max() - merged['baseline_temp_c'].min())

# Update priority_final to include temperature
merged['priority_final'] = merged['priority_final'] * (1 + 0.2 * merged['temp_priority'])
```

#### Step 3: Convert Temperature to Impact Score
```python
# Convert temperature reduction to impact per dollar
# Formula: impact = (temp_reduction * people_affected) / cost

# Estimate people affected (using population density or tree density as proxy)
merged['people_affected'] = merged.get('population_density', merged['tree_density_per_km2'] * 100)

# Cost per tree (varies by EJ score)
merged['cost_per_tree'] = 500 + merged['ej_score'] * 1500

# Impact calculation
merged['temp_impact'] = (merged['tree_cooling_c'] * 1.8) * merged['people_affected']  # Convert C to F
merged['impact_per_dollar'] = merged['temp_impact'] / (merged['cost_per_tree'] / 1000)
```

### Converting Urban Futures → Untitled Folder

#### Step 1: Extract Priority Scores
```python
# Load urban futures H3 features
urban_futures_features = pd.read_parquet('urban futures/data/models/h3_features.parquet')

# Extract priority information
priority_data = urban_futures_features[[
    'h3_cell', 'priority_final', 'ej_score', 
    'heat_vulnerability_index', 'air_quality_score',
    'tree_density_per_km2'
]].copy()

# Rename to match untitled folder format
priority_data = priority_data.rename(columns={
    'h3_cell': 'hex_id'
})
```

#### Step 2: Use Priority to Guide Tree Planting
```python
# In untitled folder, use priority to determine where to run predictions
# High priority = run detailed Earth-2 predictions

# Load untitled folder tree stats
untitled_tree_stats = pd.read_parquet('untitled folder/data/cache/tree_stats.parquet')

# Merge priority
untitled_tree_stats = untitled_tree_stats.merge(
    priority_data,
    on='hex_id',
    how='left'
)

# Filter high-priority hexes for detailed analysis
high_priority = untitled_tree_stats[
    untitled_tree_stats['priority_final'] > 0.7
].copy()

# Run Earth-2 predictions only for high-priority areas
# This saves computation time
```

#### Step 3: Use EJ Score for Weighting
```python
# When calculating trees needed, weight by EJ score
# Higher EJ score = more trees needed (higher priority)

def calculate_trees_with_ej_weight(hex_id, target_reduction, ej_score):
    """
    Calculate trees needed, weighted by EJ score.
    """
    # Base calculation from untitled folder
    base_result = tree_mitigation_model.calculate_trees_needed(
        hex_id=hex_id,
        target_reduction=target_reduction,
        ...
    )
    
    # Adjust by EJ score (EJ communities get priority)
    ej_multiplier = 1 + (ej_score * 0.3)  # Up to 30% more trees
    adjusted_trees = base_result['trees_needed'] * ej_multiplier
    
    return {
        **base_result,
        'trees_needed': int(adjusted_trees),
        'ej_adjusted': True
    }
```

## Integration Strategy

### Option 1: Use Untitled Folder for Accuracy, Urban Futures for Prioritization

1. **Use Urban Futures** to identify high-priority areas (priority_final > 0.7)
2. **Use Untitled Folder** to run detailed Earth-2 predictions for those areas
3. **Combine results**: Priority from Urban Futures + Temperature from Untitled Folder

### Option 2: Hybrid Model

1. **Temperature predictions**: Use Untitled Folder (Earth-2)
2. **Priority scoring**: Use Urban Futures (multi-factor)
3. **Final recommendation**: Weighted combination
   ```python
   final_score = (
       0.4 * temperature_priority +  # From untitled folder
       0.4 * urban_futures_priority +  # From urban futures
       0.2 * ej_score  # Environmental justice
   )
   ```

### Option 3: Sequential Workflow

1. **Phase 1**: Use Urban Futures to identify top 100 priority locations
2. **Phase 2**: Use Untitled Folder to get precise temperature predictions for those locations
3. **Phase 3**: Use Urban Futures impact model to estimate cost-benefit
4. **Phase 4**: Make final planting decisions based on combined analysis

## Code Examples

### Translation Script: Untitled → Urban Futures

```python
#!/usr/bin/env python3
"""
Translate untitled folder results to urban futures format.
"""
import pandas as pd
import numpy as np
from pathlib import Path

def translate_untitled_to_urban_futures():
    # Load untitled folder results
    untitled_path = Path('untitled folder/data/processed/FINAL_REAL_RESULTS.csv')
    untitled_data = pd.read_csv(untitled_path)
    
    # Load urban futures features
    urban_futures_path = Path('urban futures/data/models/h3_features.parquet')
    urban_futures_data = pd.read_parquet(urban_futures_path)
    
    # Extract and rename temperature data
    temp_data = untitled_data[[
        'hex_id', 'current_temperature_c', 'current_reduction'
    ]].rename(columns={
        'hex_id': 'h3_cell',
        'current_temperature_c': 'earth2_temp_c',
        'current_reduction': 'tree_cooling_c'
    })
    
    # Merge
    merged = urban_futures_data.merge(
        temp_data,
        on='h3_cell',
        how='left'
    )
    
    # Add temperature-based features
    merged['temp_priority'] = (
        (merged['earth2_temp_c'] - merged['earth2_temp_c'].min()) /
        (merged['earth2_temp_c'].max() - merged['earth2_temp_c'].min())
    ).fillna(0.5)
    
    # Update priority to include temperature
    merged['priority_final'] = merged['priority_final'] * (1 + 0.2 * merged['temp_priority'])
    
    # Save updated features
    output_path = Path('urban futures/data/models/h3_features_with_temp.parquet')
    merged.to_parquet(output_path, index=False)
    
    print(f"✅ Translated data saved to {output_path}")
    print(f"   Added {merged['earth2_temp_c'].notna().sum()} temperature predictions")
    
    return merged

if __name__ == '__main__':
    translate_untitled_to_urban_futures()
```

### Translation Script: Urban Futures → Untitled

```python
#!/usr/bin/env python3
"""
Use urban futures priority to guide untitled folder analysis.
"""
import pandas as pd
from pathlib import Path

def use_urban_futures_priority():
    # Load urban futures features
    urban_futures_path = Path('urban futures/data/models/h3_features.parquet')
    urban_futures_data = pd.read_parquet(urban_futures_path)
    
    # Get high-priority hexes
    high_priority = urban_futures_data[
        urban_futures_data['priority_final'] > 0.7
    ].copy()
    
    # Extract hex IDs for detailed analysis
    priority_hexes = high_priority['h3_cell'].tolist()
    
    print(f"✅ Found {len(priority_hexes)} high-priority hexes")
    print(f"   Priority range: {high_priority['priority_final'].min():.3f} - {high_priority['priority_final'].max():.3f}")
    
    # Save for use in untitled folder
    priority_file = Path('untitled folder/data/priority_hexes.txt')
    with open(priority_file, 'w') as f:
        for hex_id in priority_hexes:
            f.write(f"{hex_id}\n")
    
    print(f"✅ Saved priority hexes to {priority_file}")
    print(f"   Use this file to run Earth-2 predictions only for high-priority areas")
    
    return priority_hexes

if __name__ == '__main__':
    use_urban_futures_priority()
```

## Recommendations

### Which is Better?

**Neither is strictly "better"** - they serve different purposes:

- **Untitled Folder**: Better for **scientific accuracy** and **temperature prediction**
- **Urban Futures**: Better for **policy planning** and **cost-benefit analysis**

### Best Approach: Use Both

1. **Start with Urban Futures** to identify priority areas
2. **Use Untitled Folder** to get accurate temperature predictions for those areas
3. **Combine results** for comprehensive analysis

### Data Translation Priority

1. **High Priority**: Temperature data from Untitled → Urban Futures (adds scientific accuracy)
2. **Medium Priority**: Priority scores from Urban Futures → Untitled (guides analysis)
3. **Low Priority**: Full integration (requires more development)

## Next Steps

1. Run the translation scripts above
2. Test with a small subset of data
3. Validate results make sense
4. Integrate into your workflow
