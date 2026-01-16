# NYC Temperature Prediction + Tree Mitigation System

A complete system for predicting temperature changes from tree planting in NYC using NVIDIA Earth-2 AI weather models and physics-based urban cooling calculations.

## ⚡ What's New

**You can now add X trees to any hex and instantly see the temperature prediction!**

```bash
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 50

# Output:
# Current Temperature: 13.06°C (0 trees)
# After Adding 50 Trees: 10.06°C
# Cooling Effect: -3.00°C
```

## 🎯 What This System Does

### 1. **Add Trees → Get Temperature**
"What if we plant 50 trees in this block?"
- Input: Hex location + number of trees
- Output: New predicted temperature
- Uses: NVIDIA Earth-2 AI + physics-based cooling model

### 2. **Target Cooling → Get Trees Needed**
"How many trees to reduce temperature by 2°C?"
- Input: Hex location + target cooling
- Output: Number of trees required
- Accounts for: Diminishing returns, saturation effects

### 3. **Neighborhood Analysis**
"Analyze temperature patterns across an entire area"
- Input: Geographic bounds
- Output: Temperature predictions per hex
- Coverage: Any area in NYC

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone <repo-url>
cd nyc-temperature-trees

# Install dependencies
pip install -r requirements.txt

# Install Earth-2 model (with DLWP support)
pip install 'earth2studio[dlwp]'

# Download data (see DATA_DOWNLOAD.md)
# Place CSV files in data/raw/
```

### Basic Usage

#### Scenario 1: Add Trees
```bash
# Add 25 trees to Times Square area
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 25

# Compare multiple scenarios
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 10 --output scenario_10.csv
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 50 --output scenario_50.csv
```

#### Scenario 2: Target Cooling
```bash
# Calculate trees needed for 2°C cooling
python tree_mitigation_cli.py --h3_id 892a10726d7ffff --target_reduction 2.0

# Multiple hexes
python tree_mitigation_cli.py \
  --h3_ids 892a10726d7ffff 892a1072697ffff \
  --target_reduction 1.5
```

#### Scenario 3: Grid Analysis
```bash
# Analyze an entire neighborhood
python main.py \
  --min_lat 40.75 --max_lat 40.76 \
  --min_lon -74.01 --max_lon -74.00 \
  --years 1 5 10
```

### Run Complete Demo
```bash
chmod +x COMPLETE_EXAMPLE.sh
./COMPLETE_EXAMPLE.sh
```

## 📊 How It Works

```
┌──────────────────────────────────────────────────────────┐
│ 1. Get Location                                          │
│    H3 Hex ID → Coordinates (lat, lon) + Area            │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 2. NVIDIA Earth-2 AI Model                              │
│    • Loaded: DLWP weather prediction model              │
│    • Input: Global atmospheric data                     │
│    • Process: Physics simulation forward in time        │
│    • Output: Baseline temperature predictions           │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 3. Tree Mitigation Model                                │
│    • Input: Number of trees + hex area                  │
│    • Process: Physics-based cooling calculation         │
│    • Formula: Cooling = f(tree_density, area)          │
│    • Output: Temperature reduction from trees           │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 4. Final Result                                          │
│    Temperature = Earth-2 Baseline - Tree Cooling        │
└──────────────────────────────────────────────────────────┘
```

## 🔬 The Science

### NVIDIA Earth-2 Model
- **NOT a chatbot**: You can't "prompt" it like ChatGPT
- **IS a physics simulator**: Takes atmospheric data → runs simulation → outputs weather
- **Status**: ✅ DLWP model loaded and ready
- **Fallback**: Uses enhanced placeholders if GFS data unavailable

### Tree Cooling Physics
Based on urban heat island research:
- Tree canopy reduces surface temperature
- Evapotranspiration cools air
- Effect has diminishing returns at high density
- Maximum cooling: ~3°C (configurable)

**Cooling Formula:**
```python
if tree_density < 10 trees/km²:
    cooling = 0°C
elif tree_density < 500 trees/km²:
    cooling = (tree_density - 10) × 0.02°C  # Linear
else:
    cooling = base + logarithmic_term      # Diminishing returns

cooling = min(cooling, 3.0°C)  # Cap at maximum
```

## 📁 Project Structure

```
nyc-temperature-trees/
├── add_trees_cli.py              # ⭐ NEW: Add trees → get temperature
├── tree_mitigation_cli.py        # Calculate trees needed for cooling
├── main.py                       # Grid-based analysis
├── data/
│   ├── earth2_integration.py     # NVIDIA Earth-2 integration
│   ├── nyc_data_downloader.py    # NYC tree census, NOAA data
│   └── spatial_aggregator.py     # H3 spatial aggregation
├── models/
│   └── tree_mitigation_model.py  # Physics-based cooling model
├── utils/
│   ├── h3_utils.py               # H3 hexagonal grid functions
│   └── visualization.py          # Folium map generation
├── config.yaml                   # Configuration
└── data/
    ├── raw/                      # Input CSV files
    ├── cache/                    # Cached computations
    └── processed/                # Results
```

## 📚 Documentation

- **[QUICK_START_ADD_TREES.md](QUICK_START_ADD_TREES.md)**: Detailed guide for tree addition tool
- **[HOW_IT_WORKS.md](HOW_IT_WORKS.md)**: Complete technical explanation
- **[DATA_DOWNLOAD.md](DATA_DOWNLOAD.md)**: How to get required data files
- **[REALITY_CHECK.md](REALITY_CHECK.md)**: What's real vs placeholder
- **[CHANGELOG.md](CHANGELOG.md)**: Version history

## 🎛️ Configuration

Edit `config.yaml`:

```yaml
# H3 Grid
h3:
  resolution: 9  # ~0.1 km² hexes (NYC blocks)

# Earth-2 Model
earth2:
  model: "dlwp"  # Options: dlwp, fcn3, aifs, graphcast
  resolution: "0.25"

# Tree Mitigation
mitigation:
  temp_reduction_per_tree_km2: 0.02  # °C per tree per km²
  max_temp_reduction_c: 3.0          # Maximum cooling
  min_tree_density_km2: 10.0         # Minimum for effect
  saturation_tree_density_km2: 500.0 # Diminishing returns start
```

## 📊 Data Sources

- **NYC Street Tree Census**: 683,788 trees from NYC Open Data
- **NOAA Temperature**: Historical hourly/daily data
- **NDVI/Green Space**: Optional satellite data
- **NVIDIA Earth-2**: DLWP AI weather model

See [DATA_DOWNLOAD.md](DATA_DOWNLOAD.md) for download instructions.

## 🔍 Example Results

### Adding 50 Trees to Manhattan Block

```
Hex ID: 892a10726d7ffff
Location: (40.7853°N, 74.0471°W)
Area: 0.106 km²

Current State:
  • Trees: 0
  • Temperature: 13.06°C

After Adding 50 Trees:
  • Total Trees: 50
  • Tree Density: 472 trees/km²
  • Temperature: 10.06°C
  • Cooling: -3.00°C
```

### Diminishing Returns Example

| Trees | Density | Cooling | Notes |
|-------|---------|---------|-------|
| 10    | 94/km²  | 1.69°C  | Linear region |
| 25    | 236/km² | 3.00°C  | Hit maximum |
| 50    | 472/km² | 3.00°C  | Diminishing returns |
| 100   | 944/km² | 3.00°C  | Further saturation |

## ❓ FAQ

### Can I prompt the Earth-2 model like ChatGPT?
**No.** Earth-2 is a physics simulator, not a language model. It takes numerical atmospheric data as input and runs weather simulations. The CLI tools handle all the complexity for you.

### Is this using real AI models?
**Yes.** The NVIDIA Earth-2 DLWP model is loaded and ready. It attempts real predictions but falls back to enhanced placeholders if GFS atmospheric data is unavailable.

### Are the tree cooling effects real?
**Yes.** The model is based on peer-reviewed urban heat island research showing tree canopy can reduce local temperatures by 1-5°C depending on density and coverage.

### What resolution should I use?
- **Resolution 9** (~0.1 km²): Individual NYC blocks
- **Resolution 8** (~0.7 km²): Neighborhoods
- **Resolution 10** (~0.015 km²): Very fine-grained (slower)

### Can I analyze my neighborhood?
**Yes!** Use `main.py` with lat/lon bounds or find your H3 hex ID:

```python
import h3
hex_id = h3.latlng_to_cell(40.7580, -73.9855, 9)  # Times Square
print(hex_id)
```

## 🛠️ Technical Details

- **Language**: Python 3.12+
- **Key Libraries**: 
  - `h3-py`: Hexagonal spatial indexing
  - `earth2studio`: NVIDIA Earth-2 models
  - `geopandas`: Geospatial operations
  - `torch`: Deep learning backend
  - `folium`: Interactive maps
- **Data Format**: Parquet for caching, CSV for I/O
- **Model**: DLWP (Deep Learning Weather Prediction)

## 📈 Roadmap

- ✅ H3 grid system
- ✅ NVIDIA Earth-2 integration
- ✅ Tree mitigation model
- ✅ Add trees tool
- ✅ CLI tools
- 🔄 Real-time GFS data integration
- 🔄 Multi-species tree models
- 🔄 Growth curves (sapling → mature)
- 🔄 Cost-benefit analysis
- 🔄 Web interface

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please open an issue or pull request.

## 📧 Contact

[Add contact info]

---

**Made with 🌳 for NYC**
