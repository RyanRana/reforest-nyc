# NYC Climate Resilience Spatial Simulation

A full-stack geospatial simulation and interactive dashboard that identifies optimal street-tree planting locations across New York City to reduce urban heat island effects and improve air quality, maximizing climate resilience impact per dollar invested with explicit prioritization for environmental justice neighborhoods.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Mapbox)                  │
│  Bloomberg-style UI: Dark navy + neon green accent         │
│  ZIP choropleth, interactive simulation, overlays          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────────┐
│              Node.js/TypeScript Backend API                  │
│  Express server: /zip/:id, /simulate, /zips endpoints      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│   Python     │ │   C++      │ │  Parquet   │
│ Data Pipeline│ │  Inference │ │   Cache    │
│              │ │   Engine    │ │            │
└──────────────┘ └────────────┘ └────────────┘
```

## 📁 Project Structure

```
urban futures/
├── backend/              # Node.js/TypeScript API server
│   ├── src/
│   │   ├── index.ts      # Express app & routes
│   │   └── services/     # Business logic (H3, prediction, simulation)
│   └── package.json
│
├── frontend/             # React/Mapbox dashboard
│   ├── src/
│   │   ├── components/   # MapComponent, Sidebar, UI components
│   │   ├── styles/       # Bloomberg-style CSS
│   │   └── App.tsx
│   └── package.json
│
├── python/               # Data preparation & training
│   ├── data_pipeline/
│   │   ├── prepare_zip_features.py
│   │   └── h3_utils.py
│   └── model_training/
│       ├── train_model.py
│       ├── prediction_server.py
│       └── [other training scripts]
│
├── cpp/                  # Neural network inference (optional)
│   ├── src/
│   │   ├── impact_model.cpp
│   │   └── main.cpp
│   └── CMakeLists.txt
│
├── data/
│   ├── cache/            # Raw CSV datasets
│   ├── processed/        # Processed Parquet files
│   ├── external/         # ZIP boundaries, building footprints
│   └── models/           # Trained model weights & features
│
└── docs/                 # All documentation
    ├── QUICKSTART.md
    ├── PROJECT_STRUCTURE.md
    └── [other docs]
```

For detailed structure documentation, see [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## 🚀 Quick Start

See **[docs/QUICKSTART.md](docs/QUICKSTART.md)** for detailed setup instructions.

### Quick Setup

```bash
# 1. Install dependencies
./setup.sh

# 2. Configure Mapbox token
cd frontend
echo "REACT_APP_MAPBOX_TOKEN=your_token_here" > .env
echo "REACT_APP_API_URL=http://localhost:3001" >> .env
cd ..

# 3. Prepare data
cd python/data_pipeline
python3 prepare_zip_features.py
cd ../..

# 4. Start services
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend  
cd frontend && npm start
```

For detailed instructions, troubleshooting, and architecture docs, see the [docs/](docs/) directory.

## 📊 Data Sources

### Primary Datasets

- **Street Trees 2015**: Complete inventory (683k+ trees) - `data/cache/street_trees_2015.csv`
- **Heat Vulnerability Index**: ZIP-level HVI - `data/processed/heat_vulnerability_processed.parquet`
- **Air Quality**: Community District PM2.5/NO2 - `data/processed/air_quality_processed.parquet`
- **Fuel Oil Usage**: ZIP-level fuel oil gallons - `data/processed/fuel_oil_processed.parquet`
- **Indoor Environmental**: 311 complaints by ZIP - `data/processed/indoor_environmental_processed.parquet`
- **Cooling Sites**: Cooling center locations - `data/processed/cooling_sites_processed.parquet`
- **ZIP Boundaries**: TIGER/Line shapefile - `data/external/nyc_zip_boundaries/`

### Data Processing

The Python pipeline:
1. Loads all datasets
2. Computes ZIP-level tree density and DBH distribution
3. Interpolates Community District air quality to ZIP codes
4. Calculates proximity features (cooling sites, parks)
5. Generates EJ score from indoor complaints + HVI + population density
6. Computes priority scores using weighted formula

## 🧮 Impact Score Formulation

### Priority Calculation

```python
heat_score = normalized(HVI)
air_score = normalized(PM25 + NO2)
tree_gap = 1 - normalized(existing_tree_density)
pollution_proxy = normalized(fuel_oil_volume)
ej_score = normalized(indoor_complaints + pop_density)

priority_base = 0.35*heat_score + 0.25*air_score + 0.25*tree_gap + 0.15*pollution_proxy
priority_final = priority_base * (1 + 0.4*ej_score)  # Climate justice weighting
```

### Impact Prediction

The C++ neural network predicts:
- Expected temperature reduction (°F)
- Expected PM2.5 reduction (lbs/year)
- Impact index (weighted combination)
- **Impact per dollar** (final optimization target)

Literature priors:
- ~2°F cooling per tree (baseline)
- ~0.16 lbs PM2.5 removed/tree/year

## 🎯 API Endpoints

### `GET /health`
Health check endpoint.

### `GET /zip/:id`
Returns impact metrics for a specific ZIP code:
```json
{
  "zipcode": "10001",
  "impact_per_dollar": 2.45,
  "recommended_tree_count": 150,
  "projected_temp_reduction_F": 3.0,
  "projected_pm25_reduction_lbs_per_year": 24.0,
  "priority_final": 0.78,
  "ej_score": 0.65
}
```

### `GET /zips`
Returns all ZIP codes with priority scores (for choropleth).

### `GET /simulate?lat=40.7831&lon=-73.9712`
Projects lat/lon to ZIP code and runs simulation.

## 🎨 Frontend Features

- **Interactive Map**: Mapbox GL JS with ZIP choropleth
- **Priority Visualization**: Color-coded by `priority_final` score
- **Click Simulation**: Click any ZIP to see projected impacts
- **EJ Indicators**: Highlights environmental justice priority areas
- **Bloomberg-Style UI**: Dark navy (#0a1929) + neon green (#00ff88) accent

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env`):
```
PORT=3001
```

**Frontend** (`frontend/.env`):
```
REACT_APP_MAPBOX_TOKEN=your_token_here
REACT_APP_API_URL=http://localhost:3001
```

## 📈 Model Training

The model is trained on synthetic data based on literature priors. In production, you would:

1. Collect historical planting results
2. Measure actual temperature/air quality improvements
3. Train on real impact data
4. Validate with cross-validation

Current implementation uses a linear model as a placeholder for the full neural network.

## 🧪 Testing

```bash
# Test backend
cd backend
npm test

# Test data pipeline
cd python/data_pipeline
python -m pytest tests/

# Test C++ inference
cd cpp/build
./impact_model
```

## 📝 Data Provenance

All datasets are sourced from NYC Open Data:
- Street Tree Census: https://data.cityofnewyork.us/Environment/2015-Street-Tree-Census-Tree-Data/uvpi-gqnh
- Heat Vulnerability Index: NYC Department of Health
- Air Quality: NYC Community Air Survey
- Fuel Oil: NYC Department of Buildings
- 311 Complaints: NYC Open Data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- NYC Open Data for providing comprehensive datasets
- Mapbox for mapping infrastructure
- Bloomberg Philanthropies for climate resilience inspiration
