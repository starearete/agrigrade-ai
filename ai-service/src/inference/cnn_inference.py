"""
Reusable CNN Inference Interface for AgriGrade AI.
Loads PyTorch models (EfficientNet-B0) when available, handles image transforms, and executes model forward passes.
"""

import sys
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import io
from pathlib import Path

from inference.model_registry import model_registry

# Global cached model instances to prevent reloading on every request
_MODEL_CACHE = {}

def get_loaded_cnn_model(crop, task="maturity"):
    info = model_registry.get_cnn_info(crop, task)
    if info.get("model_status") != "AVAILABLE":
        return None, info

    cache_key = f"{crop}_{task}"
    if cache_key in _MODEL_CACHE:
        return _MODEL_CACHE[cache_key], info

    model_path = info["model_path"]
    num_classes = len(info["classes"])
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    try:
        model = models.efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(in_features, num_classes)
        )
        state_dict = torch.load(model_path, map_location=device)
        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()

        _MODEL_CACHE[cache_key] = model
        return model, info
    except Exception as e:
        print(f"[CNN INFERENCE ERROR] Failed to load model from {model_path}: {e}")
        info["model_status"] = "NOT_TRAINED"
        info["error"] = str(e)
        return None, info

def predict_cnn(image_input, crop, task="maturity"):
    """
    Executes CNN inference if a verified trained model exists for the crop & task.
    Returns structured result object or {"model_status": "NOT_TRAINED"}.
    """
    model, info = get_loaded_cnn_model(crop, task)

    if not model or info.get("model_status") != "AVAILABLE":
        return {
            "crop": crop,
            "task": task,
            "model_status": "NOT_TRAINED",
            "message": info.get("message", f"No verified trained CNN model available for {crop} {task}.")
        }

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load PIL Image if bytes or path
    if isinstance(image_input, bytes):
        image = Image.open(io.BytesIO(image_input)).convert("RGB")
    elif isinstance(image_input, (str, Path)):
        image = Image.open(image_input).convert("RGB")
    elif isinstance(image_input, Image.Image):
        image = image_input.convert("RGB")
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]
        conf, pred_idx = torch.max(probabilities, dim=0)

    classes = info["classes"]
    predicted_label = classes[pred_idx.item()]
    prob_dict = {cls: round(prob.item(), 4) for cls, prob in zip(classes, probabilities)}

    return {
        "model": info.get("model", "EfficientNet-B0"),
        "task": task,
        "crop": crop,
        "prediction": predicted_label,
        "confidence": round(conf.item(), 4),
        "probabilities": prob_dict,
        "model_status": "AVAILABLE"
    }
