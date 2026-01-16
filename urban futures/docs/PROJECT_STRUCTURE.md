# Project Structure & File Organization

## Overview

This document explains the organization of the codebase and what each directory/file does.

## Directory Structure

### `/backend` - Node.js/TypeScript API Server
- **Purpose**: REST API server that serves H3 cell data, runs simulations, and handles predictions
- **Key Files**:
  - `src/index.ts` - Express app setup and route definitions
  - `src/services/h3Service.ts` - H3 cell data loading and management
  - `src/services/predictionService.ts` - Prediction logic and Python server integration
  - `src/services/simulationService.ts` - Simulation calculations
- **Dependencies**: Express, H3-js, ParquetJS

### `/frontend` - React/Mapbox Dashboard
- **Purpose**: Interactive web dashboard with map visualization
- **Key Files**:
  - `src/App.tsx` - Main app component
  - `src/components/MapComponent.tsx` - Mapbox map with H3 visualization
  - `src/components/Sidebar.tsx` - Simulation controls and results
- **Dependencies**: React, Mapbox GL JS, TypeScript

### `/python` - Data Pipeline & Model Training
- **Purpose**: Data preparation, model training, and prediction servers

#### `/python/data_pipeline`
- `prepare_zip_features.py` - Main data preparation script
- `h3_utils.py` - H3 spatial utilities

#### `/python/model_training`
- **Training Scripts**:
  - `train_model.py` - Main impact prediction model training
  - `train_growth_model.py` - Tree growth ML model training
  - `train_heat_impact_model.py` - Heat impact model training
- **Prediction Servers**:
  - `prediction_server.py` - Fast prediction server (primary)
  - `ai_prediction_server.py` - AI-enhanced prediction server (alternative)
- **Predictors**:
  - `ml_tree_growth_predictor.py` - ML-based tree growth predictor
  - `tree_growth_predictor.py` - Rule-based fallback predictor
  - `earth2_ai_predictor.py` - NVIDIA Earth-2 climate predictor
- **Utilities**:
  - `load_baseline_temperature.py` - Loads baseline temperature trends

### `/cpp` - C++ Inference Engine (Optional)
- **Purpose**: High-performance neural network inference
- **Status**: Optional, can use Python models instead
- **Files**: `src/impact_model.cpp`, `src/main.cpp`

### `/data` - Datasets & Models
- **`/cache`**: Raw CSV datasets downloaded from NYC Open Data
- **`/processed`**: Processed Parquet files with aggregated features
- **`/external`**: External data (ZIP boundaries, building footprints)
- **`/models`**: Trained model weights and feature files

### `/docs` - Documentation
- All project documentation is centralized here
- See [docs/README.md](README.md) for index

## Key Data Files

### Input Data (in `/data/cache`)
- `street_trees_2015.csv` - Complete tree census
- `heat_vulnerability.csv` - Heat vulnerability index
- `air_quality.csv` - Air quality measurements
- Other NYC Open Data datasets

### Processed Data (in `/data/processed`)
- `zip_features.parquet` - ZIP-level aggregated features
- `h3_features.parquet` - H3 cell-level features
- Other processed datasets

### Models (in `/data/models`)
- `impact_model.bin` - Trained impact prediction model
- `zip_features.json` - ZIP features in JSON format (for fast loading)
- `tree_growth_ml_model.pkl` - ML tree growth model
- Other model files

## Scripts

### Setup & Development
- `setup.sh` - Install all dependencies
- `start_prediction_server.sh` - Start fast prediction server

## Configuration Files

- `requirements.txt` - Python dependencies
- `backend/package.json` - Backend Node.js dependencies
- `frontend/package.json` - Frontend React dependencies
- `frontend/.env` - Frontend environment variables (Mapbox token, API URL)

## Data Flow

1. **Data Preparation**: `python/data_pipeline/prepare_zip_features.py`
   - Loads raw data from `/data/cache`
   - Aggregates to H3 cells and ZIP codes
   - Saves to `/data/processed` and `/data/models`

2. **Model Training**: `python/model_training/train_model.py`
   - Trains on processed features
   - Saves models to `/data/models`

3. **API Request Flow**:
   - Frontend → Backend API → Prediction Service → Python Server → Model → Results

4. **Map Visualization**:
   - Backend serves H3 GeoJSON → Frontend renders on Mapbox

## File Naming Conventions

- Python scripts: `snake_case.py`
- TypeScript files: `camelCase.ts` or `PascalCase.tsx` (components)
- Data files: `descriptive_name.parquet` or `descriptive_name.json`
- Model files: `model_name.pkl` or `model_name.bin`
