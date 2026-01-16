# Changelog

## Version 0.1.0 - Initial Release

### Features
- ✅ H3 hexagonal grid generation for NYC (resolution 8-10)
- ✅ CSV-based data loading (NYC Tree Census, NOAA temperature, NDVI)
- ✅ Spatial aggregation pipeline (trees, green space, temperature per hex)
- ✅ NVIDIA Earth-2 integration via earth2studio (with DLWP support)
- ✅ Enhanced placeholder predictions with NYC-specific patterns
- ✅ Parquet-based caching for efficient processing
- ✅ Interactive Folium visualization with H3 choropleth maps
- ✅ CLI interface with flexible arguments
- ✅ Comprehensive logging and error handling

### Data Integration
- **NYC Tree Census**: Loads from CSV with automatic column detection
- **NOAA Temperature**: Supports CSV with auto F/C conversion
- **NDVI Data**: Supports both CSV and GeoTIFF raster files
- **Google Earth Engine**: Optional integration for NDVI download

### Earth-2 Integration
- DLWP model support (when `earth2studio[dlwp]` is installed)
- Enhanced placeholder predictions with:
  - NYC-specific temperature patterns
  - Seasonal variation
  - Climate change warming trend
  - Realistic noise

### Improvements Over Initial Design
- Switched from API to CSV-based data loading for reliability
- Enhanced error handling and graceful degradation
- Automatic coordinate system detection and conversion
- Flexible column name detection
- Comprehensive data validation
