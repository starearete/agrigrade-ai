"""
Dataset Organization Module for AgriGrade AI Pipeline.
Organizes audited crop images into standardized task/class directories under dataset/processed/<crop>/.
Creates README_DATASET.md for each crop.
"""

import sys
import shutil
import csv
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dataset_pipeline.config import (
    DATASET_ROOT, AUDIT_DIR, PROCESSED_DIR, SUPPORTED_CROPS, TASK_TYPES
)

def organize_crop_dataset(crop_name: str, inventory_records=None) -> Path:
    """
    Organize dataset for a specific crop into dataset/processed/<crop_name>/
    """
    crop_processed_dir = PROCESSED_DIR / crop_name
    crop_processed_dir.mkdir(parents=True, exist_ok=True)

    # Ensure task subdirectories exist
    for task in TASK_TYPES:
        (crop_processed_dir / task).mkdir(parents=True, exist_ok=True)

    # Load inventory records if not provided
    if inventory_records is None:
        inv_path = AUDIT_DIR / "dataset_inventory.csv"
        if not inv_path.exists():
            print(f"Inventory CSV not found at {inv_path}. Run audit_dataset.py first.")
            return crop_processed_dir
        
        inventory_records = []
        with open(inv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["crop"] == crop_name:
                    inventory_records.append(row)

    print(f"\n[ORGANIZING CROP] '{crop_name}' ({len(inventory_records)} records)...")

    task_class_counts = {}
    copied_count = 0
    skipped_count = 0

    for rec in inventory_records:
        if rec.get("corrupt") == "True" or rec.get("corrupt") is True:
            continue

        task = rec.get("task", "classification")
        cls_name = rec.get("class", crop_name)
        img_rel_path = rec.get("image_path", "")
        source_file = rec.get("source_file", "disk")

        # Destination path
        dest_dir = crop_processed_dir / task / cls_name
        dest_dir.mkdir(parents=True, exist_ok=True)

        filename = Path(img_rel_path).name
        dest_path = dest_dir / filename

        # Source path resolution
        if source_file == "disk":
            src_path = DATASET_ROOT / crop_name / img_rel_path
            if src_path.exists() and not dest_path.exists():
                try:
                    shutil.copy2(src_path, dest_path)
                    copied_count += 1
                except Exception as e:
                    print(f"  Error copying {src_path}: {e}")
            else:
                skipped_count += 1
        
        # Track statistics
        key = f"{task}/{cls_name}"
        task_class_counts[key] = task_class_counts.get(key, 0) + 1

    print(f"  Organized {copied_count} files (Skipped {skipped_count} existing).")

    # Generate README_DATASET.md for crop
    create_crop_readme(crop_name, crop_processed_dir, task_class_counts)

    return crop_processed_dir

def create_crop_readme(crop_name: str, crop_dir: Path, class_counts: dict):
    """
    Generate README_DATASET.md inside dataset/processed/<crop>/
    """
    readme_path = crop_dir / "README_DATASET.md"
    md = []
    md.append(f"# AgriGrade AI Dataset — `{crop_name.upper()}`")
    md.append(f"\nStandardized dataset structure for AgriGrade AI Computer Vision Model Training.\n")

    md.append("## Directory Layout")
    md.append("```")
    md.append(f"processed/{crop_name}/")
    md.append("├── raw/")
    md.append("├── classification/")
    md.append("├── maturity/")
    md.append("├── disease/")
    md.append("├── defects/")
    md.append("├── quality/")
    md.append("├── validation/")
    md.append("├── metadata.csv")
    md.append("└── README_DATASET.md")
    md.append("```\n")

    md.append("## Tasks & Class Distribution")
    md.append("| Task / Class Path | Total Valid Images | Status |")
    md.append("| :--- | :---: | :--- |")
    for key, count in sorted(class_counts.items()):
        status = "Ready for Training" if "quality" not in key and "suspicious" not in key else "Requires Ground-Truth Verification"
        md.append(f"| `processed/{crop_name}/{key}` | {count:,} | {status} |")

    md.append("\n## Data Integrity & Safety Rules")
    md.append("- Original source archives and raw images remain preserved and untouched.")
    md.append("- Grade A/B/C scores will be derived programmatically from objective quality criteria rather than arbitrary folder names.")

    with open(readme_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))

    print(f"  Wrote crop README: {readme_path}")

def run_organization(target_crops=None):
    """Run organization pipeline for specified or all crops."""
    crops = target_crops if target_crops else SUPPORTED_CROPS
    print("==================================================")
    print(" AgriGrade AI - Dataset Organization Pipeline")
    print("==================================================")
    for crop in crops:
        organize_crop_dataset(crop)

if __name__ == "__main__":
    run_organization()
