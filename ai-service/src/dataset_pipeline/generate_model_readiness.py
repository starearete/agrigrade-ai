"""
Model Readiness Generator for AgriGrade AI.
Analyzes dataset audit results and generates:
  - reports/model_readiness.json
  - reports/model_readiness_report.md
"""

import sys
import json
import csv
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dataset_pipeline.config import DATASET_ROOT, AUDIT_DIR

REPORTS_DIR = Path(r"C:\Users\naksh\.gemini\antigravity\scratch\ai-service\reports")

def run_model_readiness_analysis():
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    summary_file = AUDIT_DIR / "dataset_summary.json"
    inventory_file = AUDIT_DIR / "dataset_inventory.csv"

    if not summary_file.exists() or not inventory_file.exists():
        print(f"Error: Audit summary or inventory missing. Run audit_dataset.py first.")
        return

    with open(summary_file, "r", encoding="utf-8") as f:
        summary_data = json.load(f)

    # Read unique image counts per crop/task/class from inventory CSV
    task_stats = {}
    with open(inventory_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["corrupt"] == "True":
                continue
            crop = row["crop"]
            task = row["task"]
            cls = row["class"]
            sha = row["sha256"]
            
            key = (crop, task)
            if key not in task_stats:
                task_stats[key] = {
                    "crop": crop,
                    "task": task,
                    "all_records": 0,
                    "unique_hashes": set(),
                    "class_records": {},
                    "class_unique_hashes": {},
                    "trustworthy": row["trustworthy"] == "True",
                    "notes": row["notes"]
                }
            
            task_stats[key]["all_records"] += 1
            if sha:
                task_stats[key]["unique_hashes"].add(sha)
            
            if cls not in task_stats[key]["class_records"]:
                task_stats[key]["class_records"][cls] = 0
                task_stats[key]["class_unique_hashes"][cls] = set()
            
            task_stats[key]["class_records"][cls] += 1
            if sha:
                task_stats[key]["class_unique_hashes"][cls].add(sha)

    # Define tasks with priority and readiness evaluation
    tasks_eval = []

    # Priority order requested by user:
    # 1. Banana maturity
    # 2. Onion bulb health/disease
    # 3. Onion variety
    # 4. Okra maturity
    # 5. Crop validation models (banana, beetroot, carrot, mango, tomato)
    # 6. Other tasks (onion leaves, etc.)
    # 7. Unverified Quality Grade tasks (mango quality, banana quality) - DO NOT TRAIN

    priority_map = [
        ("banana", "maturity", 1, "EfficientNet-B0 / MobileNetV3-Large"),
        ("onion", "disease", 2, "ResNet-18 / EfficientNet-B0"),
        ("onion", "classification", 3, "EfficientNet-B0 / MobileNetV3"),
        ("okra", "maturity", 4, "MobileNetV3-Small / EfficientNet-B0"),
        ("banana", "classification", 5, "MobileNetV3-Small"),
        ("beetroot", "classification", 5, "MobileNetV3-Small"),
        ("carrot", "classification", 5, "MobileNetV3-Small"),
        ("mango", "classification", 5, "MobileNetV3-Small"),
        ("tomato", "classification", 5, "MobileNetV3-Small"),
        ("onion", "disease_leaves", 6, "ResNet-18 / MobileNetV3"),
        ("banana", "quality", 7, "N/A (Rule Engine Only)"),
        ("mango", "quality", 7, "N/A (Rule Engine Only)")
    ]

    for crop, task, priority, rec_model in priority_map:
        key = (crop, task)
        
        # Calculate stats
        if key in task_stats:
            st = task_stats[key]
            total_unique = len(st["unique_hashes"])
            class_unique_counts = {c: len(st["class_unique_hashes"][c]) for c in st["class_records"]}
            verified = st["trustworthy"]
        else:
            # Fallback for synthetic/derived tasks like classification crop validation
            total_unique = summary_data["crop_summary"][crop]["unique_usable_images"]
            class_unique_counts = {crop: total_unique}
            verified = True

        num_classes = len(class_unique_counts)
        
        # Calculate 70 / 15 / 15 splits on unique images
        train_cnt = int(total_unique * 0.70)
        val_cnt = int(total_unique * 0.15)
        test_cnt = total_unique - train_cnt - val_cnt

        # Class imbalance calculation
        counts = list(class_unique_counts.values())
        if counts and min(counts) > 0:
            imbalance_ratio = round(max(counts) / min(counts), 2)
            if imbalance_ratio == 1.0:
                imbalance_str = "None (Perfect 1:1 balance)"
            elif imbalance_ratio < 1.5:
                imbalance_str = f"Low ({imbalance_ratio}:1 max-to-min ratio)"
            elif imbalance_ratio < 3.0:
                imbalance_str = f"Moderate ({imbalance_ratio}:1 max-to-min ratio)"
            else:
                imbalance_str = f"High ({imbalance_ratio}:1 max-to-min ratio)"
        else:
            imbalance_str = "Single Class"

        # Determine training readiness and risks
        is_quality_folder_task = (task == "quality")
        
        if is_quality_folder_task:
            suitable = False
            risks = [
                "CRITICAL: Folder-based grade labels (Grade_A/B/C) are unverified subjective tags (violates Rule 14 & 15).",
                "High risk of model learning background/lighting artifacts rather than true physical quality.",
                "Small sample size for some classes (e.g. banana grade_c_medium has only 8 images)."
            ]
            additional_annotation = "Requires expert agricultural inspector defect annotations (% surface damage, bruising, decay, brix/ripeness scoring)."
        elif total_unique < 50:
            suitable = False
            risks = ["Insufficient dataset size for reliable validation."]
            additional_annotation = "Expand dataset to at least 100+ unique images per class."
        else:
            suitable = True
            risks = []
            if imbalance_ratio > 1.5:
                risks.append(f"Class imbalance ({imbalance_ratio}:1) requires weighted cross-entropy loss or focal loss.")
            if total_unique < 500:
                risks.append("Small dataset size requires heavy transfer learning and aggressive data augmentation.")
            else:
                risks.append("Low risk. Robust dataset size for fine-tuning.")
            additional_annotation = "Optional hard-negative mining and additional real-world field images."

        tasks_eval.append({
            "priority": priority,
            "crop": crop,
            "task": task,
            "number_of_classes": num_classes,
            "images_per_class": class_unique_counts,
            "total_unique_images": total_unique,
            "train_val_test_counts": {
                "train": train_cnt,
                "validation": val_cnt,
                "test": test_cnt
            },
            "class_imbalance": imbalance_str,
            "labels_verified": verified and not is_quality_folder_task,
            "suitable_for_training": suitable,
            "recommended_model_type": rec_model,
            "expected_risks": risks,
            "additional_annotation_required": additional_annotation
        })

    # Proposed Quality Grading Rule Engine Config
    proposed_quality_config = {
        "formula": "Quality Score = max(0, 100 - (Maturity Penalty + Disease Penalty + Defect Penalty))",
        "status": "PROPOSED (Algorithmic rule engine; not scientifically validated)",
        "maturity_penalties": {
            "optimal_maturity (e.g. ripe, mature)": 0,
            "sub_optimal_maturity (e.g. unripe, under_mature)": 15,
            "advanced_maturity (e.g. overripe, over_mature)": 25,
            "rotten_spoiled (e.g. rotten)": 100
        },
        "disease_penalties": {
            "healthy (no disease detected)": 0,
            "mild_disease (e.g. leaf spot < 5% surface)": 20,
            "severe_disease (e.g. bulb rot / purple blotch > 20% surface)": 60
        },
        "defect_penalties": {
            "clean_surface (no physical defects)": 0,
            "minor_defect (scratches / minor discolouration)": 10,
            "moderate_defect (cracks / bruising 5%-20% surface)": 25,
            "severe_defect (deep cuts / misshapened > 20% surface)": 50
        },
        "grade_thresholds": {
            "Grade A (Premium / Export Quality)": "Quality Score >= 90",
            "Grade B (Standard Market Quality)": "75 <= Quality Score < 90",
            "Grade C (Discount / Processing Quality)": "60 <= Quality Score < 75",
            "Reject (Non-Saleable / Waste)": "Quality Score < 60"
        },
        "required_validation_datasets": [
            "Annotated physical defect bounding boxes (cuts, cracks, bruises) across all 7 crops.",
            "Calibrated maturity surface coverage color maps.",
            "Certified USDA/FSSAI inspector-graded ground truth dataset to benchmark consensus."
        ]
    }

    # Generate JSON Report
    json_report = {
        "analysis_timestamp": datetime.now().isoformat(),
        "tasks_readiness": tasks_eval,
        "proposed_quality_grading_config": proposed_quality_config
    }

    json_out_path = REPORTS_DIR / "model_readiness.json"
    with open(json_out_path, "w", encoding="utf-8") as f:
        json.dump(json_report, f, indent=2)
    print(f"[EXPORT] Wrote JSON model readiness report: {json_out_path}")

    # Generate Markdown Report
    generate_markdown_readiness_report(tasks_eval, proposed_quality_config)

def generate_markdown_readiness_report(tasks_eval, proposed_quality_config):
    md_out_path = REPORTS_DIR / "model_readiness_report.md"
    
    md = []
    md.append("# AgriGrade AI — Model Readiness Analysis Report")
    md.append(f"\n*Analysis Timestamp:* `{datetime.now().isoformat()}`  ")
    md.append(f"*Source of Truth:* Completed Dataset Audit (`dataset/audit/dataset_summary.json`)\n")

    md.append("---")
    md.append("## Executive Model Readiness Summary")
    
    ready_tasks = [t for t in tasks_eval if t["suitable_for_training"]]
    unready_tasks = [t for t in tasks_eval if not t["suitable_for_training"]]

    md.append(f"- **Total Tasks Evaluated:** {len(tasks_eval)}")
    md.append(f"- **Tasks READY for Model Training:** {len(ready_tasks)} 🟢")
    md.append(f"- **Tasks BLOCKED / Requiring Annotation:** {len(unready_tasks)} 🔴")
    md.append("- **Training Status:** 🛑 **MODEL TRAINING NOT STARTED (Awaiting User Approval)**\n")

    md.append("---")
    md.append("## Priority Model Readiness Matrix\n")
    
    md.append("| Priority | Crop | Task | Classes | Unique Images | Train / Val / Test (70/15/15) | Verified | Training Status | Recommended Model |")
    md.append("| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |")

    for t in sorted(tasks_eval, key=lambda x: (x["priority"], x["crop"])):
        status_icon = "🟢 Ready" if t["suitable_for_training"] else "🔴 Blocked"
        ver_icon = "Yes" if t["labels_verified"] else "No (Unverified)"
        split_str = f"{t['train_val_test_counts']['train']} / {t['train_val_test_counts']['validation']} / {t['train_val_test_counts']['test']}"
        md.append(f"| **P{t['priority']}** | `{t['crop']}` | `{t['task']}` | {t['number_of_classes']} | {t['total_unique_images']:,} | {split_str} | {ver_icon} | {status_icon} | `{t['recommended_model_type']}` |")

    md.append("\n---")
    md.append("## Detailed Per-Task Readiness Breakdown\n")

    for t in sorted(tasks_eval, key=lambda x: (x["priority"], x["crop"])):
        md.append(f"### Priority P{t['priority']}: `{t['crop'].upper()}` — Task: `{t['task']}`")
        md.append(f"- **Number of Classes:** {t['number_of_classes']}")
        md.append(f"- **Class Distribution (Unique Images):**")
        for cls_name, cnt in t["images_per_class"].items():
            md.append(f"  - `{cls_name}`: {cnt:,} images")
        md.append(f"- **Total Unique Images:** {t['total_unique_images']:,}")
        md.append(f"- **Train / Validation / Test Split:** `{t['train_val_test_counts']['train']}` Train | `{t['train_val_test_counts']['validation']}` Val | `{t['train_val_test_counts']['test']}` Test")
        md.append(f"- **Class Imbalance:** {t['class_imbalance']}")
        md.append(f"- **Ground-Truth Verified:** `{t['labels_verified']}`")
        md.append(f"- **Suitable for Training:** `{t['suitable_for_training']}`")
        md.append(f"- **Recommended Architecture:** `{t['recommended_model_type']}`")
        md.append(f"- **Expected Risks:**")
        for r in t["expected_risks"]:
            md.append(f"  - {r}")
        md.append(f"- **Additional Annotation Required:** {t['additional_annotation_required']}\n")

    md.append("---")
    md.append("## Proposed Quality Grading Business-Rule Configuration")
    md.append("> [!IMPORTANT]")
    md.append("> Per **Rule 14 & Rule 15**, Grade A/B/C models WILL NOT be trained from arbitrary folder names (`mango` Grade_A/B/C or `banana` quality_labeled). Quality grades are calculated programmatically using objective predictions.\n")

    md.append(f"### Formula:")
    md.append(f"$$\\text{{Quality Score}} = \\max\\left(0, 100 - (\\text{{Maturity Penalty}} + \\text{{Disease Penalty}} + \\text{{Defect Penalty}})\\right)$$\n")
    md.append(f"*Status:* **{proposed_quality_config['status']}**\n")

    md.append("#### Proposed Maturity Penalties:")
    for k, v in proposed_quality_config["maturity_penalties"].items():
        md.append(f"- `{k}`: **-{v} pts**")

    md.append("\n#### Proposed Disease Penalties:")
    for k, v in proposed_quality_config["disease_penalties"].items():
        md.append(f"- `{k}`: **-{v} pts**")

    md.append("\n#### Proposed Defect Penalties:")
    for k, v in proposed_quality_config["defect_penalties"].items():
        md.append(f"- `{k}`: **-{v} pts**")

    md.append("\n#### Proposed Grade Threshold Boundaries:")
    for k, v in proposed_quality_config["grade_thresholds"].items():
        md.append(f"- **{k}**: `{v}`")

    md.append("\n#### Required Additional Datasets / Annotations for Quality Validation:")
    for req in proposed_quality_config["required_validation_datasets"]:
        md.append(f"- {req}")

    with open(md_out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))

    print(f"[EXPORT] Wrote Markdown model readiness report: {md_out_path}")

if __name__ == "__main__":
    run_model_readiness_analysis()
