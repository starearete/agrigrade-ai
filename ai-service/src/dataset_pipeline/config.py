"""
Configuration module for AgriGrade AI Dataset Pipeline.
Handles path resolution, crop-specific task definitions, and configuration loading.
"""

import os
from pathlib import Path
import yaml

# Base Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATASET_ROOT = PROJECT_ROOT / "dataset"
AUDIT_DIR = DATASET_ROOT / "audit"
PROCESSED_DIR = DATASET_ROOT / "processed"
CONFIGS_DIR = PROJECT_ROOT / "configs"

SUPPORTED_CROPS = ["banana", "beetroot", "carrot", "mango", "okra", "onion", "tomato"]

SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}

TASK_TYPES = [
    "classification",
    "maturity",
    "disease",
    "defects",
    "quality",
    "validation"
]

def ensure_directories():
    """Ensure essential output directories exist."""
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    CONFIGS_DIR.mkdir(parents=True, exist_ok=True)

def load_crop_config(crop_name: str) -> dict:
    """Load configuration for a specific crop."""
    config_path = CONFIGS_DIR / f"{crop_name}.yaml"
    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found for crop '{crop_name}': {config_path}")
    
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def load_all_configs() -> dict:
    """Load configurations for all supported crops."""
    configs = {}
    for crop in SUPPORTED_CROPS:
        try:
            configs[crop] = load_crop_config(crop)
        except FileNotFoundError:
            pass
    return configs
