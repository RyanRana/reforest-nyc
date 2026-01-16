# Quick Start: Data Translation Between Systems

## Overview

This guide shows you how to translate data between the **Untitled Folder** (physics-based) and **Urban Futures** (policy-focused) systems.

## Which System is Better?

**Both systems are valuable for different purposes:**

- **Untitled Folder**: Better for **scientific accuracy** and **temperature prediction**
  - Uses NVIDIA Earth-2 AI climate model
  - Physics-based temperature predictions
  - Good for "what-if" scenarios

- **Urban Futures**: Better for **policy planning** and **cost-benefit analysis**
  - Multi-factor priority scoring
  - Environmental justice weighting
  - Impact per dollar optimization

**Recommendation**: Use both! Start with Urban Futures to identify priority areas, then use Untitled Folder for detailed temperature predictions.

## Quick Translation Commands

### 1. Translate Untitled Folder → Urban Futures

Adds temperature predictions from Untitled Folder to Urban Futures features:

```bash
cd /Users/ryanrana/Downloads/nycleap
python translate_untitled_to_urban_futures.py
```

This will:
- Load temperature predictions from `untitled folder/data/processed/FINAL_REAL_RESULTS.csv`
- Merge with Urban Futures H3 features
- Update priority scores to include temperature data
- Save to `urban futures/data/models/h3_features_with_temp.parquet`

### 2. Use Urban Futures Priority → Guide Untitled Folder

Identifies high-priority hexes for detailed Earth-2 analysis:

```bash
cd /Users/ryanrana/Downloads/nycleap
python use_urban_futures_priority.py --priority-threshold 0.7
```

This will:
- Load Urban Futures H3 features
- Find hexes with priority >= 0.7
- Save list to `untitled folder/data/priority_hexes.txt`
- Use this list to run Earth-2 predictions only for high-priority areas

## Detailed Workflow

### Workflow 1: Add Temperature Data to Urban Futures

**Goal**: Enhance Urban Futures with accurate temperature predictions from Untitled Folder

```bash
# Step 1: Run translation
python translate_untitled_to_urban_futures.py

# Step 2: Update Urban Futures backend to use new features
# Edit: urban futures/backend/src/services/h3Service.ts
# Change: featuresPath to point to h3_features_with_temp.parquet

# Step 3: Restart backend
cd urban futures/backend
npm start
```

**Result**: Urban Futures now includes Earth-2 temperature predictions in priority calculations.

### Workflow 2: Use Priority to Guide Detailed Analysis

**Goal**: Run expensive Earth-2 predictions only for high-priority areas

```bash
# Step 1: Identify priority hexes
python use_urban_futures_priority.py --priority-threshold 0.7 --max-hexes 100

# Step 2: Run Earth-2 predictions for priority hexes only
cd "untitled folder"
for hex_id in $(cat data/priority_hexes.txt | head -10); do
  python add_trees_cli.py --h3_id $hex_id --add_trees 50
done

# Step 3: Translate results back to Urban Futures
cd ..
python translate_untitled_to_urban_futures.py
```

**Result**: You've run detailed analysis only where it matters most, saving computation time.

### Workflow 3: Hybrid Analysis

**Goal**: Combine both systems for comprehensive analysis

```python
# 1. Load Urban Futures priority
import pandas as pd
urban_priority = pd.read_parquet('urban futures/data/models/h3_features.parquet')

# 2. Load Untitled Folder temperature
untitled_temp = pd.read_csv('untitled folder/data/processed/FINAL_REAL_RESULTS.csv')

# 3. Combine
merged = urban_priority.merge(
    untitled_temp[['hex_id', 'current_temperature_c', 'current_reduction']],
    left_on='h3_cell',
    right_on='hex_id',
    how='inner'
)

# 4. Create hybrid score
merged['hybrid_score'] = (
    0.4 * merged['priority_final'] +  # Urban Futures priority
    0.4 * (merged['current_temperature_c'] / merged['current_temperature_c'].max()) +  # Temperature
    0.2 * merged['ej_score']  # Environmental justice
)

# 5. Sort by hybrid score
merged = merged.sort_values('hybrid_score', ascending=False)

# 6. Top recommendations
print(merged[['h3_cell', 'hybrid_score', 'priority_final', 'current_temperature_c']].head(10))
```

## Customization

### Adjust Priority Threshold

```bash
# More selective (top 10%)
python use_urban_futures_priority.py --priority-threshold 0.9

# Less selective (top 50%)
python use_urban_futures_priority.py --priority-threshold 0.5
```

### Limit Number of Hexes

```bash
# Only top 50 hexes
python use_urban_futures_priority.py --priority-threshold 0.7 --max-hexes 50
```

### Custom File Paths

```bash
# Use custom paths
python translate_untitled_to_urban_futures.py \
  --untitled-results "path/to/results.csv" \
  --urban-futures-features "path/to/features.parquet" \
  --output "path/to/output.parquet"
```

## Troubleshooting

### Error: File not found

**Problem**: Script can't find input files

**Solution**: Check file paths exist:
```bash
ls "untitled folder/data/processed/FINAL_REAL_RESULTS.csv"
ls "urban futures/data/models/h3_features.parquet"
```

### Error: No matches found

**Problem**: No hexes match between systems

**Solution**: Check hex ID format matches (should be H3 hex IDs like `892a10726d7ffff`)

### Error: Priority threshold too high

**Problem**: No hexes found above threshold

**Solution**: Lower the threshold:
```bash
python use_urban_futures_priority.py --priority-threshold 0.5
```

## Next Steps

1. **Run translation scripts** to see how data flows between systems
2. **Test with small subset** to validate results
3. **Integrate into workflow** based on your needs
4. **Customize** priority thresholds and weights

## See Also

- `COMPARISON_AND_TRANSLATION.md` - Detailed comparison and technical details
- `untitled folder/README.md` - Untitled Folder documentation
- `urban futures/README.md` - Urban Futures documentation
