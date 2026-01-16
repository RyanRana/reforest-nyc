# Data Download Guide

This project uses CSV files for data input. Follow these instructions to download the required datasets.

## Required Data Files

### 1. NYC Street Tree Census

**File**: `data/raw/nyc_tree_census.csv`

**Download**:
1. Visit: https://data.cityofnewyork.us/Environment/2015-Street-Tree-Census-Tree-Data/pi5s-9p35
2. Click "Export" → "CSV"
3. Save as `nyc_tree_census.csv` in the `data/raw/` directory

**Expected columns**: The CSV should contain latitude and longitude columns (may be named `latitude`/`longitude`, `lat`/`lon`, or `y`/`x`). Other useful columns include `tree_dbh` (diameter at breast height), `status`, etc.

**Alternative**: For the 2025 census (when available), download from the NYC Open Data portal.

### 2. NOAA Temperature Data

**File**: `data/raw/noaa_temperature.csv`

**Download Options**:

#### Option A: Global Summary of the Day (GSOD)
1. Visit: https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/
2. Select station `USW00094728` (Central Park, NYC)
3. Download data for years 2015-2024
4. Combine into single CSV with columns: `DATE`, `STATION`, `TEMP` (or `TEMP_C`), `LATITUDE`, `LONGITUDE`

#### Option B: NOAA Climate Data Online (CDO)
1. Visit: https://www.ncei.noaa.gov/cdo-web/
2. Search for station `USW00094728` (Central Park)
3. Select daily temperature data
4. Export as CSV with columns: `date`, `station_id`, `temperature_c` (or `temperature_f`), `lat`, `lon`

**Expected format**:
```csv
date,station_id,temperature_c,lat,lon
2015-01-01,USW00094728,5.0,40.7829,-73.9654
2015-01-02,USW00094728,6.2,40.7829,-73.9654
...
```

**Note**: If temperature is in Fahrenheit, the code will automatically convert to Celsius.

### 3. NDVI/Green Space Data (Optional)

**Option A: CSV File**
**File**: `data/raw/ndvi_data.csv`

**Expected format**:
```csv
lat,lon,ndvi,date
40.7128,-73.9352,0.65,2015-06-15
40.7200,-73.9400,0.72,2015-06-15
...
```

**Download**: Can be generated from:
- Google Earth Engine (see below)
- Landsat/Sentinel-2 processing
- Pre-processed NDVI datasets

**Option B: GeoTIFF Raster**
**File**: `data/raw/ndvi_raster.tif`

**Download**: Export NDVI raster from:
- Google Earth Engine
- USGS EarthExplorer (Landsat)
- Copernicus Open Access Hub (Sentinel-2)

## Google Earth Engine Setup (Optional)

For NDVI data from Google Earth Engine:

1. **Sign up**: https://earthengine.google.com/
2. **Authenticate**:
   ```bash
   pip install earthengine-api
   earthengine authenticate
   ```
3. **Export NDVI data**:
   - Use GEE Code Editor to calculate NDVI from Sentinel-2 or Landsat
   - Export to CSV or GeoTIFF
   - Place in `data/raw/` directory

## Data Directory Structure

After downloading, your `data/` directory should look like:

```
data/
├── raw/
│   ├── nyc_tree_census.csv          # Required
│   ├── noaa_temperature.csv         # Required
│   ├── ndvi_data.csv                # Optional
│   └── ndvi_raster.tif              # Optional (alternative to CSV)
├── cache/                           # Auto-generated (parquet files)
└── processed/                       # Auto-generated (output files)
```

## Quick Start Without Data

If you don't have data files yet, the system will:
- Create placeholder structures for missing data
- Still generate H3 grid and run predictions with placeholder temperature data
- Log warnings about missing data files

You can test the system structure with:
```bash
python main.py --process-data
```

## Data Validation

The system will automatically:
- Detect column names (handles various naming conventions)
- Convert coordinate systems
- Filter to NYC bounding box
- Cache processed data in Parquet format for faster subsequent runs

## Troubleshooting

### "File not found" errors
- Ensure CSV files are in `data/raw/` directory
- Check file names match `config.yaml` settings
- Verify file permissions

### "Could not find lat/lon columns"
- Check CSV has coordinate columns
- Column names can be: `latitude`/`longitude`, `lat`/`lon`, `y`/`x`
- Update `config.yaml` if using different column names

### Temperature conversion issues
- System auto-detects Fahrenheit vs Celsius
- If values > 50, assumes Fahrenheit and converts
- Ensure temperature column is numeric (no text values)
