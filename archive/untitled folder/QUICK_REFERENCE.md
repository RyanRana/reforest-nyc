# Quick Reference Card

## 🎯 Main Use Cases

### "What if we add X trees?"
```bash
python add_trees_cli.py --h3_id <HEX> --add_trees <NUMBER>
```

### "How many trees for Y°C cooling?"
```bash
python tree_mitigation_cli.py --h3_id <HEX> --target_reduction <DEGREES>
```

### "Analyze a neighborhood"
```bash
python main.py --min_lat <LAT1> --max_lat <LAT2> --min_lon <LON1> --max_lon <LON2>
```

## 📋 Common Commands

### Single Hex Examples
```bash
# Add 50 trees to Times Square area
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 50

# Calculate trees needed for 2°C cooling
python tree_mitigation_cli.py --h3_id 892a10726d7ffff --target_reduction 2.0

# Use cached predictions (faster)
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 25 --use_cached_predictions
```

### Multiple Hexes
```bash
# Add trees to multiple locations
python add_trees_cli.py \
  --h3_ids 892a10726d7ffff 892a1072697ffff 892a10760cfffff \
  --add_trees 30

# Analyze multiple locations
python tree_mitigation_cli.py \
  --h3_ids 892a10726d7ffff 892a1072697ffff \
  --target_reduction 1.5
```

### Custom Output
```bash
# Save to specific file
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 40 --output my_results.csv

# Save as JSON
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 40 --output results.json
```

## 🔍 Finding H3 IDs

### Method 1: Python
```python
import h3

# From coordinates
hex_id = h3.latlng_to_cell(40.7580, -73.9855, 9)  # Times Square
print(hex_id)  # '892a1072b47ffff'

# Get coordinates from hex
lat, lon = h3.cell_to_latlng('892a10726d7ffff')
print(f"({lat:.4f}, {lon:.4f})")
```

### Method 2: Online Tool
Visit: https://h3geo.org/

## 📊 Understanding Results

### Add Trees Output
```
Current State:
  • Trees: 10
  • Temperature: 14.50°C

After Adding 25 Trees:
  • Total Trees: 35
  • Temperature: 12.00°C
  • Cooling: -2.50°C
```

### Key Fields in CSV
- `hex_id`: Location identifier
- `current_temp_c`: Temperature before adding trees
- `new_temp_c`: Temperature after adding trees
- `temp_change_c`: Temperature difference (negative = cooling)
- `trees_added`: Number of trees you added

## 🎛️ Key Parameters (config.yaml)

```yaml
# Tree cooling parameters
mitigation:
  temp_reduction_per_tree_km2: 0.02  # Cooling per tree per km²
  max_temp_reduction_c: 3.0          # Maximum possible cooling
  min_tree_density_km2: 10.0         # Minimum density for effect
  saturation_tree_density_km2: 500.0 # Where diminishing returns start
```

## 📈 Expected Cooling by Tree Count

For typical NYC block (~0.1 km²):

| Trees | Density | Expected Cooling |
|-------|---------|------------------|
| 5     | 47/km²  | ~0.7°C          |
| 10    | 94/km²  | ~1.7°C          |
| 15    | 142/km² | ~2.6°C          |
| 20    | 189/km² | ~3.0°C (max)    |
| 50    | 472/km² | ~3.0°C (max)    |

## 🚨 Common Issues

### "No Earth-2 predictions found"
**Solution:** Generate predictions first:
```bash
python main.py --h3_id <HEX> --years 1 5 10
```
Or run without `--use_cached_predictions` flag.

### "Tree statistics not found"
**Solution:** This is normal. System will use 0 as baseline if no tree data is aggregated yet.

### "Error in DLWP prediction"
**Solution:** Normal fallback behavior. System will use enhanced placeholders if GFS data unavailable.

## 💡 Pro Tips

1. **First Run**: Generate predictions without `--use_cached_predictions`
2. **Subsequent Runs**: Add `--use_cached_predictions` for speed
3. **Multiple Scenarios**: Run different tree counts and compare CSVs
4. **Realistic Targets**: Aim for 1-3°C cooling (based on research)
5. **Check Feasibility**: Use tree_mitigation_cli.py to verify targets

## 🔗 Quick Links

- Full Guide: [HOW_IT_WORKS.md](HOW_IT_WORKS.md)
- Tutorial: [QUICK_START_ADD_TREES.md](QUICK_START_ADD_TREES.md)
- Data Setup: [DATA_DOWNLOAD.md](DATA_DOWNLOAD.md)
- Technical Details: [REALITY_CHECK.md](REALITY_CHECK.md)

## 📞 Help

```bash
# Get help for any tool
python add_trees_cli.py --help
python tree_mitigation_cli.py --help
python main.py --help
```
