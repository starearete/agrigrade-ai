"""
Master Pipeline Orchestrator for P1 Banana Maturity Model Training & Evaluation.
Executes in sequence:
  1. prepare_banana_splits.py
  2. train_banana_cnn.py (EfficientNet-B0 Baseline)
  3. train_banana_vit.py (Optional ViT Comparison)
  4. evaluate_banana_models.py (Metrics, Confusion Matrices, Latency & Comparison Report)
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dataset_pipeline.prepare_banana_splits import prepare_banana_maturity_splits
from training.train_banana_cnn import run_cnn_training
from training.train_banana_vit import run_vit_training
from evaluation.evaluate_banana_models import evaluate_all

def main():
    print("==================================================================")
    print(" AgriGrade AI — P1 Banana Maturity Training & Evaluation Pipeline")
    print("==================================================================")
    
    t0 = time.time()

    # Step 1: Prepare exact 70/15/15 splits (3,931 / 842 / 843)
    print("\n>>> STEP 1/4: Preparing Stratified Dataset Splits...")
    prepare_banana_maturity_splits(seed=42)

    # Step 2: Train EfficientNet-B0 CNN Baseline
    print("\n>>> STEP 2/4: Training EfficientNet-B0 CNN Baseline...")
    run_cnn_training()

    # Step 3: Train Optional ViT Comparison Model
    print("\n>>> STEP 3/4: Training Optional Vision Transformer (ViT)...")
    run_vit_training()

    # Step 4: Evaluate & Compare Models
    print("\n>>> STEP 4/4: Evaluating Models on Held-Out Test Set & Generating Comparison Report...")
    evaluate_all()

    total_time = round(time.time() - t0, 2)
    print(f"\n==================================================================")
    print(f" PIPELINE COMPLETE in {total_time} seconds!")
    print(f" Reports saved in: reports/banana_maturity/")
    print(f" Models saved in:  models/banana_maturity/")
    print("==================================================================")

if __name__ == "__main__":
    main()
