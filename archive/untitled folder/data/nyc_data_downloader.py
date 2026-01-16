"""Download and process NYC open data from CSV files."""

import pandas as pd
import geopandas as gpd
from pathlib import Path
from typing import Optional, Dict, Any
import logging
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)


class NYCDataDownloader:
    """Load NYC open data from CSV files."""
    
    def __init__(self, config: Dict[str, Any], cache_dir: Path):
        """
        Initialize NYC data downloader.
        
        Args:
            config: Configuration dictionary
            cache_dir: Directory for caching processed data
        """
        self.config = config
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Get raw data directory
        self.raw_data_dir = Path(config["processing"]["raw_data_dir"])
        self.raw_data_dir.mkdir(parents=True, exist_ok=True)
    
    def download_tree_census(
        self,
        force_download: bool = False
    ) -> gpd.GeoDataFrame:
        """
        Load NYC Street Tree Census data from CSV.
        
        Args:
            force_download: Force re-process even if cached
            
        Returns:
            GeoDataFrame with tree locations
        """
        cache_file = self.cache_dir / "nyc_tree_census.parquet"
        
        if cache_file.exists() and not force_download:
            logger.info(f"Loading cached tree census data from {cache_file}")
            return gpd.read_parquet(cache_file)
        
        # Get CSV path from config
        csv_path = Path(self.config["data_sources"]["nyc_open_data"]["tree_census"]["csv_path"])
        
        if not csv_path.exists():
            # Try relative to raw data dir
            csv_path = self.raw_data_dir / csv_path.name
            if not csv_path.exists():
                logger.error(f"Tree census CSV not found at {csv_path}")
                logger.info("Please download NYC Street Tree Census CSV and place it in data/raw/")
                logger.info("Download from: https://data.cityofnewyork.us/Environment/2015-Street-Tree-Census-Tree-Data/pi5s-9p35")
                raise FileNotFoundError(f"Tree census CSV not found: {csv_path}")
        
        logger.info(f"Loading NYC Street Tree Census data from {csv_path}...")
        
        try:
            # Read CSV (handle large files with chunking if needed)
            df = pd.read_csv(csv_path, low_memory=False)
            logger.info(f"Loaded {len(df)} tree records from CSV")
            
            # Find latitude/longitude columns (check exact matches first)
            lat_col = None
            lon_col = None
            
            # Try exact matches first
            if "latitude" in df.columns and "longitude" in df.columns:
                lat_col, lon_col = "latitude", "longitude"
            elif "lat" in df.columns and "lon" in df.columns:
                lat_col, lon_col = "lat", "lon"
            elif "Latitude" in df.columns and "Longitude" in df.columns:
                lat_col, lon_col = "Latitude", "Longitude"
            else:
                # Try partial matches (more specific patterns to avoid false matches)
                for col in df.columns:
                    col_lower = col.lower().strip()
                    # Only match if it's explicitly a coordinate column
                    if lat_col is None and col_lower in ['latitude', 'lat', 'y_coord', 'y']:
                        lat_col = col
                    if lon_col is None and col_lower in ['longitude', 'lon', 'lng', 'long', 'x_coord', 'x']:
                        lon_col = col
            
            if lat_col is None or lon_col is None:
                raise ValueError(f"Could not find latitude/longitude columns. Available columns: {df.columns.tolist()}")
            
            # Convert to numeric, handling any non-numeric values
            df[lat_col] = pd.to_numeric(df[lat_col], errors='coerce')
            df[lon_col] = pd.to_numeric(df[lon_col], errors='coerce')
            
            # Remove rows with invalid coordinates
            valid_coords = df[lat_col].notna() & df[lon_col].notna()
            df = df[valid_coords].copy()
            
            # Don't filter by bounding box - keep all valid coordinate data
            # (H3 spatial aggregation will handle geographic filtering)
            logger.info(f"Kept all {len(df)} trees with valid coordinates")
            
            # Create GeoDataFrame
            gdf = gpd.GeoDataFrame(
                df,
                geometry=gpd.points_from_xy(
                    df[lon_col],
                    df[lat_col]
                ),
                crs="EPSG:4326"
            )
            
            # Cache the processed data
            gdf.to_parquet(cache_file, compression="snappy")
            logger.info(f"Cached processed tree census data to {cache_file}")
            
            return gdf
            
        except Exception as e:
            logger.error(f"Error loading tree census data: {e}")
            raise
    
    def download_noaa_temperature(
        self,
        station_id: str,
        start_date: str,
        end_date: str,
        force_download: bool = False
    ) -> pd.DataFrame:
        """
        Load NOAA temperature data from CSV.
        
        Args:
            station_id: NOAA station ID (e.g., "USW00094728" for Central Park)
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            force_download: Force re-process even if cached
            
        Returns:
            DataFrame with temperature data (columns: date, station_id, temperature_c, lat, lon)
        """
        cache_file = self.cache_dir / f"noaa_temp_{station_id}_{start_date}_{end_date}.parquet"
        
        if cache_file.exists() and not force_download:
            logger.info(f"Loading cached NOAA temperature data from {cache_file}")
            return pd.read_parquet(cache_file)
        
        # Get CSV path from config
        csv_path = Path(self.config["data_sources"]["noaa"]["temperature_csv"])
        
        if not csv_path.exists():
            # Try relative to raw data dir
            csv_path = self.raw_data_dir / csv_path.name
            if not csv_path.exists():
                logger.warning(f"NOAA temperature CSV not found at {csv_path}")
                logger.info("Creating placeholder temperature data. Please provide CSV file.")
                logger.info("Expected CSV format: date, station_id, temperature_c (or temperature_f), lat, lon")
                logger.info("Download from: https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/")
                
                # Return placeholder with expected structure
                df = pd.DataFrame({
                    "date": pd.date_range(start_date, end_date, freq="D"),
                    "station_id": station_id,
                    "temperature_c": np.nan,
                    "lat": 40.7829,  # Central Park approximate
                    "lon": -73.9654
                })
                return df
        
        logger.info(f"Loading NOAA temperature data from {csv_path}...")
        
        try:
            # Read CSV
            df = pd.read_csv(csv_path, low_memory=False)
            logger.info(f"Loaded {len(df)} temperature records from CSV")
            
            # Find date column
            date_col = None
            for col in df.columns:
                col_lower = col.lower()
                if any(x in col_lower for x in ['date', 'time', 'datetime']):
                    date_col = col
                    break
            
            if date_col is None:
                raise ValueError(f"Could not find date column. Available columns: {df.columns.tolist()}")
            
            # Convert date column
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            
            # Filter by date range
            start = pd.to_datetime(start_date)
            end = pd.to_datetime(end_date)
            df = df[(df[date_col] >= start) & (df[date_col] <= end)].copy()
            
            # Find temperature column
            temp_col = None
            for col in df.columns:
                col_lower = col.lower()
                if any(x in col_lower for x in ['temp', 'temperature', 'tavg', 'tmax', 'tmin']):
                    temp_col = col
                    break
            
            # Find lat/lon columns
            lat_col = None
            lon_col = None
            for col in df.columns:
                col_lower = col.lower()
                if lat_col is None and any(x in col_lower for x in ['lat', 'latitude', 'y']):
                    lat_col = col
                if lon_col is None and any(x in col_lower for x in ['lon', 'lng', 'longitude', 'long', 'x']):
                    lon_col = col
            
            # Standardize column names
            result_df = pd.DataFrame()
            result_df["date"] = df[date_col]
            
            if "station_id" in df.columns:
                result_df["station_id"] = df["station_id"]
            elif "station" in df.columns:
                result_df["station_id"] = df["station"]
            else:
                result_df["station_id"] = station_id
            
            # Handle temperature (convert F to C if needed)
            if temp_col:
                temp_values = pd.to_numeric(df[temp_col], errors='coerce')
                # Check if values are in Fahrenheit range (> 50) or Celsius
                if temp_values.max() > 50:
                    # Likely Fahrenheit, convert to Celsius
                    result_df["temperature_c"] = (temp_values - 32) * 5/9
                    result_df["temperature_f"] = temp_values
                else:
                    result_df["temperature_c"] = temp_values
                    result_df["temperature_f"] = temp_values * 9/5 + 32
            else:
                result_df["temperature_c"] = np.nan
                result_df["temperature_f"] = np.nan
            
            # Add lat/lon if available
            if lat_col:
                result_df["lat"] = pd.to_numeric(df[lat_col], errors='coerce')
            else:
                result_df["lat"] = 40.7829  # Central Park default
            
            if lon_col:
                result_df["lon"] = pd.to_numeric(df[lon_col], errors='coerce')
            else:
                result_df["lon"] = -73.9654  # Central Park default
            
            # Remove rows with invalid dates
            result_df = result_df[result_df["date"].notna()].copy()
            
            # Cache processed data
            result_df.to_parquet(cache_file, compression="snappy")
            logger.info(f"Cached processed temperature data to {cache_file}")
            
            return result_df
            
        except Exception as e:
            logger.error(f"Error loading NOAA temperature data: {e}")
            logger.info("Returning placeholder data structure")
            # Return placeholder
            return pd.DataFrame({
                "date": pd.date_range(start_date, end_date, freq="D"),
                "station_id": station_id,
                "temperature_c": np.nan,
                "temperature_f": np.nan,
                "lat": 40.7829,
                "lon": -73.9654
            })
    
    def download_ndvi_data(
        self,
        start_date: str,
        end_date: str,
        force_download: bool = False
    ) -> Optional[gpd.GeoDataFrame]:
        """
        Load NDVI data from CSV or raster file.
        
        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            force_download: Force re-process even if cached
            
        Returns:
            GeoDataFrame with NDVI data (or None if not available)
        """
        cache_file = self.cache_dir / f"ndvi_{start_date}_{end_date}.parquet"
        
        if cache_file.exists() and not force_download:
            logger.info(f"Loading cached NDVI data from {cache_file}")
            return gpd.read_parquet(cache_file)
        
        ndvi_config = self.config["data_sources"].get("ndvi", {})
        
        # Try CSV first
        if "csv_path" in ndvi_config:
            csv_path = Path(ndvi_config["csv_path"])
            if not csv_path.exists():
                csv_path = self.raw_data_dir / csv_path.name
            
            if csv_path.exists():
                logger.info(f"Loading NDVI data from CSV: {csv_path}")
                try:
                    df = pd.read_csv(csv_path, low_memory=False)
                    
                    # Find lat/lon columns
                    lat_col = None
                    lon_col = None
                    for col in df.columns:
                        col_lower = col.lower()
                        if lat_col is None and any(x in col_lower for x in ['lat', 'latitude', 'y']):
                            lat_col = col
                        if lon_col is None and any(x in col_lower for x in ['lon', 'lng', 'longitude', 'long', 'x']):
                            lon_col = col
                    
                    if lat_col and lon_col:
                        # Convert to GeoDataFrame
                        gdf = gpd.GeoDataFrame(
                            df,
                            geometry=gpd.points_from_xy(
                                pd.to_numeric(df[lon_col], errors='coerce'),
                                pd.to_numeric(df[lat_col], errors='coerce')
                            ),
                            crs="EPSG:4326"
                        )
                        
                        # Filter by date if date column exists
                        date_col = None
                        for col in df.columns:
                            if any(x in col.lower() for x in ['date', 'time']):
                                date_col = col
                                break
                        
                        if date_col:
                            gdf[date_col] = pd.to_datetime(gdf[date_col], errors='coerce')
                            start = pd.to_datetime(start_date)
                            end = pd.to_datetime(end_date)
                            gdf = gdf[(gdf[date_col] >= start) & (gdf[date_col] <= end)].copy()
                        
                        gdf.to_parquet(cache_file, compression="snappy")
                        logger.info(f"Cached NDVI data to {cache_file}")
                        return gdf
                except Exception as e:
                    logger.warning(f"Error loading NDVI CSV: {e}")
        
        # Try raster file
        if "raster_path" in ndvi_config:
            raster_path = Path(ndvi_config["raster_path"])
            if not raster_path.exists():
                raster_path = self.raw_data_dir / raster_path.name
            
            if raster_path.exists():
                logger.info(f"Loading NDVI data from raster: {raster_path}")
                try:
                    import rasterio
                    from rasterio.warp import transform_geom
                    from shapely.geometry import shape
                    
                    with rasterio.open(raster_path) as src:
                        # Read raster data
                        data = src.read(1)  # Read first band
                        
                        # Get transform and CRS
                        transform = src.transform
                        crs = src.crs
                        
                        # Convert to points (sample at regular intervals for efficiency)
                        height, width = data.shape
                        step = max(1, min(height, width) // 1000)  # Sample every Nth pixel
                        
                        geometries = []
                        values = []
                        
                        for row in range(0, height, step):
                            for col in range(0, width, step):
                                if not np.isnan(data[row, col]):
                                    # Convert pixel to lat/lon
                                    lon, lat = rasterio.transform.xy(transform, row, col)
                                    geometries.append(Point(lon, lat))
                                    values.append(data[row, col])
                        
                        gdf = gpd.GeoDataFrame(
                            {"ndvi": values},
                            geometry=geometries,
                            crs=crs
                        )
                        
                        # Reproject to WGS84 if needed
                        if crs != "EPSG:4326":
                            gdf = gdf.to_crs("EPSG:4326")
                        
                        gdf.to_parquet(cache_file, compression="snappy")
                        logger.info(f"Cached NDVI raster data to {cache_file}")
                        return gdf
                except ImportError:
                    logger.warning("rasterio not available. Install with: pip install rasterio")
                except Exception as e:
                    logger.warning(f"Error loading NDVI raster: {e}")
        
        # Try Google Earth Engine if available
        try:
            import ee
            logger.info("Attempting to load NDVI from Google Earth Engine...")
            return self._download_ndvi_gee(start_date, end_date, cache_file)
        except ImportError:
            logger.info("Google Earth Engine not available. Skipping GEE NDVI download.")
        except Exception as e:
            logger.warning(f"Error with Google Earth Engine: {e}")
        
        logger.info("NDVI data not available. Returning None.")
        return None
    
    def _download_ndvi_gee(
        self,
        start_date: str,
        end_date: str,
        cache_file: Path
    ) -> Optional[gpd.GeoDataFrame]:
        """Download NDVI from Google Earth Engine."""
        try:
            import ee
            
            # Initialize Earth Engine (user must authenticate first)
            try:
                ee.Initialize()
            except Exception:
                logger.warning("Earth Engine not authenticated. Run: earthengine authenticate")
                return None
            
            # Get NYC bounding box
            bbox = self.config["nyc_bbox"]
            nyc_bbox = ee.Geometry.Rectangle([
                bbox["min_lon"], bbox["min_lat"],
                bbox["max_lon"], bbox["max_lat"]
            ])
            
            # Load Sentinel-2 collection
            collection = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                         .filterDate(start_date, end_date)
                         .filterBounds(nyc_bbox)
                         .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20)))
            
            # Calculate NDVI
            def add_ndvi(image):
                ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
                return image.addBands(ndvi)
            
            collection = collection.map(add_ndvi)
            
            # Get median NDVI
            ndvi_image = collection.select('NDVI').median()
            
            # Sample at points (create grid of sample points)
            # For efficiency, sample at ~500m intervals
            sample_points = []
            step = 0.005  # ~500m
            for lat in np.arange(bbox["min_lat"], bbox["max_lat"], step):
                for lon in np.arange(bbox["min_lon"], bbox["max_lon"], step):
                    sample_points.append(ee.Geometry.Point([lon, lat]))
            
            # Sample NDVI values
            samples = ndvi_image.sampleRegions(
                collection=ee.FeatureCollection(sample_points),
                scale=30,
                geometries=True
            )
            
            # Convert to GeoDataFrame (this requires downloading data)
            # For now, return None and let user export manually
            logger.info("NDVI data available from GEE. Consider exporting to CSV/GeoTIFF first.")
            return None
            
        except Exception as e:
            logger.error(f"Error downloading NDVI from GEE: {e}")
            return None
