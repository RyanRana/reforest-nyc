"""Configuration loader for NYC UHI prediction system."""

import yaml
from pathlib import Path
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


def load_config(config_path: str = "config.yaml") -> Dict[str, Any]:
    """
    Load configuration from YAML file.
    
    Args:
        config_path: Path to config.yaml file
        
    Returns:
        Dictionary containing configuration
    """
    config_file = Path(config_path)
    
    if not config_file.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(config_file, "r") as f:
        config = yaml.safe_load(f)
    
    logger.info(f"Loaded configuration from {config_path}")
    return config


def get_cache_dir(config: Dict[str, Any]) -> Path:
    """Get cache directory path from config."""
    cache_dir = Path(config["processing"]["cache_dir"])
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir


def get_output_dir(config: Dict[str, Any]) -> Path:
    """Get output directory path from config."""
    output_dir = Path(config["processing"]["output_dir"])
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def get_raw_data_dir(config: Dict[str, Any]) -> Path:
    """Get raw data directory path from config."""
    raw_dir = Path(config["processing"]["raw_data_dir"])
    raw_dir.mkdir(parents=True, exist_ok=True)
    return raw_dir
