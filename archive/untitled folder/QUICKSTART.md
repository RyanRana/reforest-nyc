# Quick Start Guide

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Or install as package
pip install -e .
```

## Basic Usage

### 1. Process Data Only

```bash
python main.py --process-data
```

This will:
- Create H3 grid covering NYC
- Download NYC Street Tree Census data
- Download NOAA temperature data
- Aggregate data per H3 hexagon
- Save feature DataFrame to `data/processed/features.parquet`

### 2. Predict for Specific H3 Hex

```bash
python main.py --h3_id 892a1f3bfffffff --years 1 5 10
```

Replace `892a1f3bfffffff` with your H3 hex ID.

### 3. Predict for All Hexes

```bash
python main.py --all --years 1 5 10
```

### 4. Generate Visualizations

```bash
python main.py --all --years 1 5 10 --visualize
```

This creates an interactive HTML map at `data/processed/predictions_map.html`.

## Project Structure

```
.
├── main.py                 # CLI entry point
├── config.yaml            # Configuration file
├── requirements.txt       # Python dependencies
├── data/                  # Data modules
│   ├── nyc_data_downloader.py    # Download NYC open data
│   ├── spatial_aggregator.py     # Aggregate data per hex
│   └── earth2_integration.py     # NVIDIA Earth-2 integration
├── utils/                 # Utility modules
│   ├── config_loader.py   # Load configuration
│   ├── logger.py          # Logging setup
│   ├── h3_utils.py        # H3 grid utilities
│   └── visualization.py   # Folium maps
├── models/                # Prediction models (placeholder)
└── data/                  # Data directories (created at runtime)
    ├── raw/              # Raw downloaded data
    ├── cache/            # Cached processed data
    └── processed/        # Final outputs
```

## Configuration

Edit `config.yaml` to customize:

- **H3 Resolution**: Change `h3.default_resolution` (8-10 recommended)
- **NYC Bounding Box**: Adjust `nyc_bbox` coordinates
- **Earth-2 Model**: Choose `corrdiff` or `fourcastnet`
- **Data Sources**: Update API endpoints and dataset IDs

## Data Sources

### NYC Street Tree Census
- Source: NYC Open Data API
- Dataset ID: Configured in `config.yaml`
- Cached to: `data/cache/nyc_tree_census.parquet`

### Temperature Data
- Source: NOAA Central Park station
- Station ID: `USW00094728` (configurable)
- Note: Requires NOAA API integration (placeholder provided)

### NDVI/Green Space
- Source: Landsat/Sentinel via Google Earth Engine
- Note: Requires GEE authentication (placeholder provided)

## H3 Hexagon Resolution

- **Resolution 8**: ~0.46 km² per hex (coarser)
- **Resolution 9**: ~0.11 km² per hex (recommended for NYC)
- **Resolution 10**: ~0.03 km² per hex (finer, more hexes)

## Troubleshooting

### Missing Dependencies
```bash
pip install -r requirements.txt
```

### Earth-2 Not Available
The system will use placeholder predictions if `earth2studio` is not installed. Install with:
```bash
pip install earth2studio
```

### Google Earth Engine Not Configured
NDVI data requires GEE authentication. See [Earth Engine Setup](https://developers.google.com/earth-engine/guides/python_install).

### Data Download Errors
- Check internet connection
- Verify API endpoints in `config.yaml`
- Use `--force-download` to refresh cached data

## Next Steps

1. **Complete NOAA Integration**: Implement actual NOAA API calls in `data/nyc_data_downloader.py`
2. **Add GEE Integration**: Configure Google Earth Engine for NDVI data
3. **Enhance Earth-2**: Complete Earth-2 model initialization and inference
4. **Add More Features**: Building height, impervious surface, elevation
5. **Model Training**: Train custom UHI models using aggregated features

## Example Script

Run the example script to see basic functionality:

```bash
python example_usage.py
```
