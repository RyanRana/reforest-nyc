# Interactive Map Guide

## 🗺️ Interactive H3 Hex Map

You now have a fully interactive web map showing NYC temperature and tree data!

## 🚀 Quick Start

### 1. Generate Map Data

```bash
# Generate data for a specific area (Manhattan midtown)
python generate_map_data.py \
  --min_lat 40.75 --max_lat 40.77 \
  --min_lon -74.01 --max_lon -73.99 \
  --resolution 9
```

### 2. Open the Map

```bash
# Open in your default browser
open index.html

# Or double-click index.html in Finder
```

## 🎯 Features

### Interactive Hex Grid
- **Color-coded by temperature**: Red = warmer, Blue = cooler
- **Click any hex** to see detailed information
- **Hover effect**: Hexes highlight on mouseover

### Data Panel (Click a Hex)
Shows for selected hexagon:
- ✅ Current temperature (°C and °F)
- ✅ Hex ID and location coordinates
- ✅ Hex area
- ✅ Current tree count
- ✅ Tree density (trees/km²)

### Tree Addition Simulator
- **Interactive slider**: Add 0-100 trees
- **Real-time calculation**: See temperature change instantly
- **Physics-based**: Uses same model as CLI tools

### Color Legend
- Shows temperature ranges
- Helps identify hot/cool areas quickly

## 📸 What You'll See

```
┌─────────────────────────────────────────────────────────┐
│                    NYC MIDTOWN MAP                      │
│                                                         │
│  [Hex Grid with Colors]        ┌──────────────────┐   │
│   🟦 🟦 🟦                      │  Hex Details     │   │
│  🟦 🟨 🟨 🟧                     │                  │   │
│   🟨 🟧 🟧                      │  13.5°C          │   │
│  🟧 🟧 🟧 🟥                     │  56.3°F          │   │
│   🟧 🟥 🟥                      │                  │   │
│                                 │  Trees: 42       │   │
│                                 │                  │   │
│                                 │  Add Trees:      │   │
│                                 │  [====|----] 50  │   │
│                                 │                  │   │
│                                 │  New Temp:       │   │
│                                 │  10.5°C (-3.0°C) │   │
│                                 └──────────────────┘   │
│                                                         │
│  Legend:                                                │
│  🟦 < 10°C    🟨 12-14°C    🟥 > 16°C                  │
│  🟦 10-12°C   🟧 14-16°C                               │
└─────────────────────────────────────────────────────────┘
```

## 🎮 How to Use

### Step 1: View the Grid
- Map loads with color-coded hexagons
- Blue = cooler areas
- Red = warmer areas

### Step 2: Click a Hex
- Click any hexagon on the map
- Info panel appears on the right
- Shows temperature, trees, location

### Step 3: Simulate Adding Trees
1. Use the slider to add trees (0-100)
2. See real-time temperature prediction
3. Watch cooling effect calculation

### Step 4: Explore Different Areas
- Click different hexes to compare
- Find hottest/coolest areas
- Identify areas that need more trees

## 🛠️ Generate Data for Different Areas

### Entire Manhattan
```bash
python generate_map_data.py \
  --min_lat 40.70 --max_lat 40.82 \
  --min_lon -74.02 --max_lon -73.93
```

### Brooklyn
```bash
python generate_map_data.py \
  --min_lat 40.63 --max_lat 40.72 \
  --min_lon -74.04 --max_lon -73.88
```

### Custom Area
```bash
python generate_map_data.py \
  --min_lat <MIN_LAT> \
  --max_lat <MAX_LAT> \
  --min_lon <MIN_LON> \
  --max_lon <MAX_LON> \
  --resolution 9
```

## ⚙️ Options

### Resolution Levels
- **Resolution 8**: ~0.7 km² per hex (neighborhood level)
- **Resolution 9**: ~0.1 km² per hex (block level, recommended)
- **Resolution 10**: ~0.015 km² per hex (very fine, slower)

### Output File
```bash
python generate_map_data.py --output my_area.json
```

Then update `index.html`:
```javascript
// Line 195, change:
const response = await fetch('map_data.json');
// to:
const response = await fetch('my_area.json');
```

## 📊 Understanding the Data

### Temperature Colors
| Color | Temperature | Meaning |
|-------|-------------|---------|
| 🔵 Blue | < 10°C | Very cool |
| 🔷 Light Blue | 10-12°C | Cool |
| ⚪ White | 12-14°C | Moderate |
| 🟠 Orange | 14-16°C | Warm |
| 🔴 Red | > 16°C | Hot |

### Tree Simulator

The slider shows **real-time predictions** using the same physics model as the CLI tools:

**Example:**
- Current: 15 trees, 14.0°C
- Add: 25 trees (slider)
- Result: 40 total trees, 12.5°C
- Cooling: -1.5°C

## 🌐 Serving the Map

### Local File (Simplest)
```bash
# Just open the file
open index.html
```

### Local Server (Better)
```bash
# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000
```

### Production Server
Upload both files to web server:
- `index.html`
- `map_data.json`

## 🔧 Customization

### Change Color Scheme
Edit `index.html`, line ~203:
```javascript
function getTemperatureColor(temp) {
    if (temp < 10) return '#0571b0';  // Blue
    if (temp < 12) return '#92c5de';  // Light blue
    if (temp < 14) return '#f7f7f7';  // White
    if (temp < 16) return '#f4a582';  // Orange
    return '#ca0020';                  // Red
}
```

### Change Tree Slider Range
Edit `index.html`, line ~140:
```html
<input type="range" min="0" max="100" value="0" id="treesSlider">
```

Change `max="100"` to any value.

### Change Tree Mitigation Parameters
Edit `index.html`, line ~184:
```javascript
const TEMP_REDUCTION_PER_TREE = 0.02;  // °C per tree per km²
const MAX_TEMP_REDUCTION = 3.0;         // Maximum cooling
const MIN_TREE_DENSITY = 10.0;          // Minimum for effect
const SATURATION_DENSITY = 500.0;       // Diminishing returns
```

## 📱 Mobile Support

The map is fully responsive:
- ✅ Works on phones and tablets
- ✅ Touch-friendly hex selection
- ✅ Responsive info panel

## 🐛 Troubleshooting

### "Error loading data"
**Solution:** Run `generate_map_data.py` first to create `map_data.json`

### Map doesn't load
**Solution:** Check browser console (F12) for errors. Ensure files are in same directory.

### Hexes don't show
**Solution:** Verify `map_data.json` has data:
```bash
cat map_data.json | head -50
```

### Can't click hexes
**Solution:** Make sure JavaScript is enabled in browser.

## 💡 Tips

1. **Generate data for smaller areas first** (faster)
2. **Use Resolution 9** for best balance of detail and performance
3. **Click multiple hexes** to compare temperatures
4. **Use tree slider** to experiment with different scenarios
5. **Check generated `map_data.json`** if map looks empty

## 🔗 Integration with CLI Tools

The map uses the **same physics model** as CLI tools:

```bash
# CLI prediction
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 50

# Map prediction (same hex, same trees)
# Click hex 892a10726d7ffff, slide to 50 trees
# Results will match!
```

## 📚 Related Documentation

- [QUICK_START_ADD_TREES.md](QUICK_START_ADD_TREES.md) - CLI tools guide
- [HOW_IT_WORKS.md](HOW_IT_WORKS.md) - Technical details
- [README.md](README.md) - Main project documentation

## 🎉 Example Workflow

```bash
# 1. Generate data for Times Square area
python generate_map_data.py \
  --min_lat 40.75 --max_lat 40.77 \
  --min_lon -74.01 --max_lon -73.99

# 2. Open map
open index.html

# 3. Click around to explore
# 4. Use slider to test tree additions
# 5. Generate data for different area and repeat!
```

Enjoy exploring NYC temperatures with the interactive map! 🌳🗽
