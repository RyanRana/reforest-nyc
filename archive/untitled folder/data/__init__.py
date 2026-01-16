"""Data ingestion and processing modules."""

from .nyc_data_downloader import NYCDataDownloader
from .spatial_aggregator import SpatialAggregator
from .earth2_integration import Earth2Predictor

__all__ = [
    "NYCDataDownloader",
    "SpatialAggregator",
    "Earth2Predictor",
]
