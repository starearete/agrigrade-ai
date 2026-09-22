"""
Metadata Generation Module for AgriGrade AI Pipeline.
Generates metadata.csv inside dataset/processed/<crop>/metadata.csv.
"""

import sys
import csv
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dataset_pipeline.config import (
    DATASET_ROOT, AUDIT_DIR, PROCESSED_DIR, SUPPORTED_CROPS
)

def create_crop_metadata(crop_name: str) -> Path:
    """
    Generate metadata.csv for a specific crop under dataset/processed/<crop_name>/metadata.csv
    """
    crop_processed_dir = PROCESSED_DIR / crop_name
    metadata_csv_path = crop_processed_dir / "metadata.csv"
    inv_csv_path = AUDIT_DIR / "dataset_inventory.csv"

    if not inv_csv_path.exists():
        print(f"Inventory CSV not found at {inv_csv_path}. Run audit_dataset.py first.")
        return metadata_csv_path

    crop_rows = []
    with open(inv_csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["crop"] == crop_name:
                crop_rows.append(row)

    print(f"Writing metadata.csv for '{crop_name}' ({len(crop_rows)} entries)...")
    
    fieldnames = [
        "image_path", "crop", "task", "class", "split", "width", "height",
        "format", "file_size", "duplicate_group", "corrupt", "label_source",
        "trustworthy", "sha256", "notes"
    ]

    with open(metadata_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in crop_rows:
            writer.writerow({k: r.get(k, "") for k in fieldnames})

    print(f"  Wrote {metadata_csv_path}")
    return metadata_csv_path

def run_metadata_generation(target_crops=None):
    """Run metadata generation for specified or all crops."""
    crops = target_crops if target_crops else SUPPORTED_CROPS
    print("==================================================")
    print(" AgriGrade AI - Metadata Generation Pipeline")
    print("==================================================")
    for crop in crops:
        create_crop_metadata(crop)

if __name__ == "__main__":
    run_metadata_generation()
