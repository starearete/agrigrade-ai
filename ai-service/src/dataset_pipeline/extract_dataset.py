"""
Dataset Extraction Module for AgriGrade AI Pipeline.
Safely extracts ZIP archives into dataset/processed/<crop>/raw/ without modifying source archives.
Supports idempotent extraction and resuming.
"""

import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dataset_pipeline.config import DATASET_ROOT, PROCESSED_DIR, SUPPORTED_CROPS, SUPPORTED_IMAGE_EXTENSIONS

def extract_crop_zips(crop_name: str) -> Path:
    """
    Extract ZIP archives for a crop into dataset/processed/<crop_name>/raw/
    """
    crop_src_dir = DATASET_ROOT / crop_name
    crop_raw_dir = PROCESSED_DIR / crop_name / "raw"
    crop_raw_dir.mkdir(parents=True, exist_ok=True)

    if not crop_src_dir.exists():
        print(f"Crop directory not found: {crop_src_dir}")
        return crop_raw_dir

    zip_files = list(crop_src_dir.rglob("*.zip"))
    if not zip_files:
        print(f"No ZIP archives found for '{crop_name}'.")
        return crop_raw_dir

    for zip_path in zip_files:
        print(f"Extracting '{zip_path.name}' -> '{crop_raw_dir}'...")
        with zipfile.ZipFile(zip_path, "r") as zf:
            members = [m for m in zf.infolist() if not m.is_dir()]
            extracted_count = 0
            skipped_count = 0

            for member in members:
                target_path = crop_raw_dir / member.filename
                if target_path.exists() and target_path.stat().st_size == member.file_size:
                    skipped_count += 1
                    continue
                
                target_path.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(member) as source, open(target_path, "wb") as target:
                    target.write(source.read())
                extracted_count += 1

            print(f"  Extracted: {extracted_count} files, Skipped (already exists): {skipped_count} files.")

    return crop_raw_dir

def run_extraction(target_crops=None):
    """Run ZIP extraction for specified or all crops."""
    crops = target_crops if target_crops else SUPPORTED_CROPS
    print("==================================================")
    print(" AgriGrade AI - Dataset Extraction Pipeline")
    print("==================================================")
    for crop in crops:
        extract_crop_zips(crop)

if __name__ == "__main__":
    run_extraction()
