"""
EfficientNet-B0 CNN Baseline Training Script for Banana Maturity Classification.
Includes 2-stage transfer learning (frozen backbone -> fine-tuning), class-weighted CE loss,
Cosine Annealing LR scheduler, early stopping, and metric logging.
"""

import sys
import os
import time
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dataset_pipeline.config import PROCESSED_DIR

def run_cnn_training():
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
    from torchvision import transforms, datasets, models
    import numpy as np

    print("==================================================")
    print(" AgriGrade AI — Training EfficientNet-B0 CNN Baseline")
    print("==================================================")

    data_dir = PROCESSED_DIR / "banana" / "maturity"
    train_dir = data_dir / "train"
    val_dir = data_dir / "val"
    
    if not train_dir.exists() or not val_dir.exists():
        print(f"Error: Dataset splits not found at {data_dir}. Run prepare_banana_splits.py first.")
        return

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using Device: {device}")

    # Data Transforms (224x224)
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_dataset = datasets.ImageFolder(root=str(train_dir), transform=train_transform)
    val_dataset = datasets.ImageFolder(root=str(val_dir), transform=val_transform)

    class_names = train_dataset.classes
    num_classes = len(class_names)
    print(f"Classes ({num_classes}): {class_names}")
    print(f"Train Dataset Size: {len(train_dataset):,} images")
    print(f"Validation Dataset Size: {len(val_dataset):,} images")

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=2, pin_memory=True)

    # Class Weights for Imbalance
    class_counts = [0] * num_classes
    for _, label in train_dataset.samples:
        class_counts[label] += 1
    
    total_samples = sum(class_counts)
    class_weights = [total_samples / (num_classes * count) for count in class_counts]
    weight_tensor = torch.tensor(class_weights, dtype=torch.float).to(device)
    print(f"Class Weights: {dict(zip(class_names, [round(w, 3) for w in class_weights]))}")

    # Model Definition (EfficientNet-B0)
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
    
    # Replace classifier head
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes)
    )
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(weight=weight_tensor)

    output_dir = Path(r"C:\Users\naksh\.gemini\antigravity\scratch\ai-service\models\banana_maturity\cnn")
    best_model_dir = output_dir / "best_model"
    best_model_dir.mkdir(parents=True, exist_ok=True)

    checkpoint_path = best_model_dir / "model.pth"
    if checkpoint_path.exists():
        print(f"[RESUME] Found existing saved checkpoint at {checkpoint_path}. Loading saved model weights...")
        try:
            model.load_state_dict(torch.load(checkpoint_path, map_location=device))
            print("[RESUME] Successfully loaded saved model weights to resume training!")
        except Exception as e:
            print(f"[RESUME WARNING] Could not load checkpoint ({e}), starting fresh.")

    history = {
        "epoch": [], "train_loss": [], "train_acc": [],
        "val_loss": [], "val_acc": [], "stage": []
    }

    best_val_loss = float("inf")
    best_val_acc = 0.0
    patience = 5
    patience_counter = 0

    start_time = time.time()

    # ==================== STAGE 1: Frozen Backbone ====================
    print("\n--- STAGE 1: Training Classification Head (5 Epochs) ---")
    for param in model.features.parameters():
        param.requires_grad = False

    optimizer_stage1 = torch.optim.AdamW(model.classifier.parameters(), lr=1e-3, weight_decay=1e-2)

    for epoch in range(1, 6):
        model.train()
        running_loss, running_corrects = 0.0, 0
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer_stage1.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer_stage1.step()

            _, preds = torch.max(outputs, 1)
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        epoch_train_loss = running_loss / len(train_dataset)
        epoch_train_acc = (running_corrects.double() / len(train_dataset)).item()

        # Validation
        model.eval()
        val_loss, val_corrects = 0.0, 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                _, preds = torch.max(outputs, 1)
                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)

        epoch_val_loss = val_loss / len(val_dataset)
        epoch_val_acc = (val_corrects.double() / len(val_dataset)).item()

        print(f"Stage 1 Epoch {epoch}/5 | Train Loss: {epoch_train_loss:.4f} Acc: {epoch_train_acc:.4f} | Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc:.4f}")

        history["epoch"].append(epoch)
        history["train_loss"].append(epoch_train_loss)
        history["train_acc"].append(epoch_train_acc)
        history["val_loss"].append(epoch_val_loss)
        history["val_acc"].append(epoch_val_acc)
        history["stage"].append("stage1")

        if epoch_val_loss < best_val_loss:
            best_val_loss = epoch_val_loss
            best_val_acc = epoch_val_acc
            torch.save(model.state_dict(), best_model_dir / "model.pth")

    # ==================== STAGE 2: Fine-Tuning Backbone ====================
    print("\n--- STAGE 2: Fine-Tuning Backbone (15 Epochs) ---")
    for param in model.features.parameters():
        param.requires_grad = True

    optimizer_stage2 = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-2)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer_stage2, T_max=15, eta_min=1e-6)

    for epoch in range(6, 21):
        model.train()
        running_loss, running_corrects = 0.0, 0
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer_stage2.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer_stage2.step()

            _, preds = torch.max(outputs, 1)
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        scheduler.step()
        epoch_train_loss = running_loss / len(train_dataset)
        epoch_train_acc = (running_corrects.double() / len(train_dataset)).item()

        # Validation
        model.eval()
        val_loss, val_corrects = 0.0, 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                _, preds = torch.max(outputs, 1)
                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)

        epoch_val_loss = val_loss / len(val_dataset)
        epoch_val_acc = (val_corrects.double() / len(val_dataset)).item()

        print(f"Stage 2 Epoch {epoch}/20 | Train Loss: {epoch_train_loss:.4f} Acc: {epoch_train_acc:.4f} | Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc:.4f} | LR: {scheduler.get_last_lr()[0]:.6f}")

        history["epoch"].append(epoch)
        history["train_loss"].append(epoch_train_loss)
        history["train_acc"].append(epoch_train_acc)
        history["val_loss"].append(epoch_val_loss)
        history["val_acc"].append(epoch_val_acc)
        history["stage"].append("stage2")

        if epoch_val_loss < best_val_loss:
            best_val_loss = epoch_val_loss
            best_val_acc = epoch_val_acc
            patience_counter = 0
            torch.save(model.state_dict(), best_model_dir / "model.pth")
            print(f"  [SAVED BEST MODEL] New Best Val Loss: {best_val_loss:.4f} Acc: {best_val_acc:.4f}")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"\n[EARLY STOPPING] Triggered at epoch {epoch}. Best Val Loss: {best_val_loss:.4f}")
                break

    training_time = round(time.time() - start_time, 2)

    # Save Class Names JSON
    with open(output_dir / "class_names.json", "w", encoding="utf-8") as f:
        json.dump(class_names, f, indent=2)

    # Save Model Metadata JSON
    metadata = {
        "architecture": "EfficientNet-B0",
        "crop": "banana",
        "task": "maturity",
        "input_resolution": "224x224",
        "num_classes": num_classes,
        "class_names": class_names,
        "training_samples": len(train_dataset),
        "val_samples": len(val_dataset),
        "best_val_loss": round(best_val_loss, 4),
        "best_val_accuracy": round(best_val_acc, 4),
        "training_time_seconds": training_time,
        "device": str(device),
        "history": history
    }

    with open(output_dir / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[COMPLETE] CNN Baseline Training Finished in {training_time}s.")
    print(f"Saved artifacts to {output_dir}")

if __name__ == "__main__":
    run_cnn_training()
