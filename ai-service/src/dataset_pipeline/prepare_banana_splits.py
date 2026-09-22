"""
Banana Dataset Splitting & Preprocessing Module.
Prepares 70/15/15 stratified train/val/test splits for Banana Maturity Classification
from 5,616 unique verified images with zero data leakage.
"""

import sys
import csv
import json
import shutil
from pathlib import Path
import random

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dataset_pipeline.config import DATASET_ROOT, AUDIT_DIR, PROCESSED_DIR

def prepare_banana_maturity_splits(seed=42):
    random.seed(seed)
    inv_csv_path = AUDIT_DIR / "dataset_inventory.csv"

    if not inv_csv_path.exists():
        print(f"Error: Inventory CSV not found at {inv_csv_path}")
        return

    print("==================================================")
    print(" AgriGrade AI — Banana Maturity Split Preparation")
    print("==================================================")

    # 1. Filter unique banana maturity images
    seen_hashes = set()
    records_by_class = {}

    with open(inv_csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["crop"] == "banana" and row["task"] == "maturity" and row["corrupt"] == "False":
                sha = row["sha256"]
                cls = row["class"]
                if sha and sha not in seen_hashes:
                    seen_hashes.add(sha)
                    if cls not in records_by_class:
                        records_by_class[cls] = []
                    records_by_class[cls].append(row)

    total_unique = sum(len(recs) for recs in records_by_class.values())
    print(f"Total Unique Verified Banana Maturity Images Found: {total_unique:,}")
    for cls, recs in records_by_class.items():
        print(f"  - {cls}: {len(recs):,} unique images")

    # 2. Target Output Directory
    base_split_dir = PROCESSED_DIR / "banana" / "maturity"
    if base_split_dir.exists():
        shutil.rmtree(base_split_dir)

    for split in ["train", "val", "test"]:
        for cls in records_by_class:
            (base_split_dir / split / cls).mkdir(parents=True, exist_ok=True)

    manifest = {
        "crop": "banana",
        "task": "maturity",
        "total_unique_images": total_unique,
        "seed": seed,
        "splits": {"train": {}, "val": {}, "test": {}},
        "split_counts": {"train": 0, "val": 0, "test": 0}
    }

    train_hashes = set()
    val_hashes = set()
    test_hashes = set()

    # 3. Stratified 70 / 15 / 15 Split
    for cls, recs in sorted(records_by_class.items()):
        random.shuffle(recs)
        n = len(recs)
        n_train = int(n * 0.70)
        n_val = int(n * 0.15)
        n_test = n - n_train - n_val

        train_recs = recs[:n_train]
        val_recs = recs[n_train:n_train + n_val]
        test_recs = recs[n_train + n_val:]

        manifest["splits"]["train"][cls] = len(train_recs)
        manifest["splits"]["val"][cls] = len(val_recs)
        manifest["splits"]["test"][cls] = len(test_recs)

        manifest["split_counts"]["train"] += len(train_recs)
        manifest["split_counts"]["val"] += len(val_recs)
        manifest["split_counts"]["test"] += len(test_recs)

        for rec, split, hash_set in [
            (train_recs, "train", train_hashes),
            (val_recs, "val", val_hashes),
            (test_recs, "test", test_hashes)
        ]:
            for r in rec:
                hash_set.add(r["sha256"])
                # Source file path
                img_rel = r["image_path"]
                src_path = DATASET_ROOT / "banana" / img_rel
                if not src_path.exists():
                    src_path = DATASET_ROOT / img_rel
                
                ext = Path(img_rel).suffix
                if not ext:
                    ext = ".jpg"
                dest_filename = f"{r['sha256'][:16]}{ext}"
                dest_dir = base_split_dir / split / cls
                dest_dir.mkdir(parents=True, exist_ok=True)
                dest_path = dest_dir / dest_filename
                
                if src_path.exists():
                    shutil.copy2(src_path, dest_path)
                else:
                    fallback_clean = DATASET_ROOT / "banana" / "banana" / "clean" / "maturity" / r["split"] / cls / Path(img_rel).name
                    if fallback_clean.exists():
                        shutil.copy2(fallback_clean, dest_path)

    # 4. Verify Zero Hash Overlap
    assert len(train_hashes & val_hashes) == 0, "DATA LEAKAGE DETECTED: Train and Val overlap!"
    assert len(train_hashes & test_hashes) == 0, "DATA LEAKAGE DETECTED: Train and Test overlap!"
    assert len(val_hashes & test_hashes) == 0, "DATA LEAKAGE DETECTED: Val and Test overlap!"

    print("\n[VERIFICATION PASSED] Zero Data Leakage Across Splits!")
    print(f"  - Train Count: {manifest['split_counts']['train']} (70%)")
    print(f"  - Validation Count: {manifest['split_counts']['val']} (15%)")
    print(f"  - Test Count: {manifest['split_counts']['test']} (15%)")

    manifest_path = base_split_dir / "banana_splits_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"[EXPORT] Wrote manifest: {manifest_path}")

if __name__ == "__main__":
    prepare_banana_maturity_splits()
