"""
Centralized Model Registry for AgriGrade AI.
Registers supported crops, available CNN/YOLO models, and handles canonical naming and model statuses.
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "models"
CONFIGS_DIR = BASE_DIR / "configs" / "grading"

CROP_CANONICAL_MAP = {
    "banana": "banana",
    "bananas": "banana",

    "mango": "mango",
    "mangoes": "mango",

    "tomato": "tomato",
    "tomatoes": "tomato",

    "onion": "onion",
    "onions": "onion",

    "brinjal": "brinjal",
    "eggplant": "brinjal",
    "baingan": "brinjal",

    "okra": "okra",
    "bhendi": "okra",
    "bhindi": "okra",
    "ladies finger": "okra",
    "lady finger": "okra",

    "green_chilli": "green_chilli",
    "green chilli": "green_chilli",
    "green chili": "green_chilli",
    "chilli": "green_chilli",
    "chili": "green_chilli",

    "drumstick": "drumstick",
    "moringa": "drumstick",
    "murungai": "drumstick",

    "beetroot": "beetroot",
    "beet": "beetroot",

    "bottle_gourd": "bottle_gourd",
    "bottle gourd": "bottle_gourd",
    "lauki": "bottle_gourd",

    "bitter_gourd": "bitter_gourd",
    "bitter gourd": "bitter_gourd",
    "karela": "bitter_gourd",

    "snake_gourd": "snake_gourd",
    "snake gourd": "snake_gourd",
    "pudalangai": "snake_gourd",

    "carrot": "carrot",
    "carrots": "carrot",
    "gajar": "carrot",

    "tapioca": "tapioca",
    "cassava": "tapioca",
    "maravalli": "tapioca"
}

CROP_DISPLAY_NAMES = {
    "banana": "Banana",
    "mango": "Mango",
    "tomato": "Tomato",
    "onion": "Onion",
    "brinjal": "Brinjal / Eggplant",
    "okra": "Bhendi / Okra",
    "green_chilli": "Green Chilli",
    "drumstick": "Drumstick / Moringa",
    "beetroot": "Beetroot",
    "bottle_gourd": "Bottle Gourd",
    "bitter_gourd": "Bitter Gourd",
    "snake_gourd": "Snake Gourd",
    "carrot": "Carrot",
    "tapioca": "Tapioca / Cassava"
}

class ModelRegistry:
    def __init__ (self):
        self.models_dir = MODELS_DIR
        self._verify_registered_models()

    def _verify_registered_models(self):
        trained_multi_crop_path = Path(r"C:\Users\naksh\.gemini\antigravity\scratch\agrigrade-frontend\crop-quality-ai\crop-quality-ai\models\crop_grade_model.keras")
        has_multi_crop = trained_multi_crop_path.exists()

        self.registry = {
            "banana": {
                "maturity": {
                    "architecture": "EfficientNet-B0",
                    "task": "maturity",
                    "classes": ["overripe", "ripe", "rotten", "unripe"],
                    "model_path": self.models_dir / "banana_maturity" / "cnn" / "best_model" / "model.pth",
                    "input_size": (224, 224),
                    "confidence_threshold": 0.60
                }
            }
        }

        # Add multi-crop trained models from crop-quality-ai
        for crop in ["mango", "tomato", "onion", "okra", "carrot"]:
            self.registry[crop] = {
                "quality": {
                    "architecture": "MobileNetV2 (Keras)",
                    "task": "quality_grade_classification",
                    "classes": [f"{crop}_grade_a", f"{crop}_grade_b", f"{crop}_grade_c"],
                    "model_path": trained_multi_crop_path,
                    "input_size": (224, 224),
                    "experimental": True
                }
            }

    def resolve_crop(self, crop_input):
        if not crop_input:
            return None
        cleaned = str(crop_input).lower().strip()
        return CROP_CANONICAL_MAP.get(cleaned, None)

    def get_display_name(self, canonical_crop):
        return CROP_DISPLAY_NAMES.get(canonical_crop, canonical_crop.replace("_", " ").title())

    def get_cnn_info(self, canonical_crop, task="maturity"):
        crop_models = self.registry.get(canonical_crop, {})
        # If default task is requested but quality model exists, return quality task
        if task not in crop_models and "quality" in crop_models:
            task = "quality"

        task_info = crop_models.get(task, None)

        if not task_info:
            return {
                "crop": canonical_crop,
                "task": task,
                "model_status": "NOT_TRAINED",
                "message": f"No trained CNN model currently available for {canonical_crop}. Routing to Gemini Multimodal Vision."
            }

        path = Path(task_info["model_path"])
        if path.exists():
            return {
                "crop": canonical_crop,
                "task": task,
                "model": task_info["architecture"],
                "classes": task_info["classes"],
                "model_path": str(path),
                "model_status": "AVAILABLE",
                "experimental": task_info.get("experimental", False),
                "confidence_threshold": task_info.get("confidence_threshold", 0.50)
            }
        else:
            return {
                "crop": canonical_crop,
                "task": task,
                "architecture": task_info["architecture"],
                "model_status": "NOT_TRAINED",
                "message": f"Model configuration exists for {canonical_crop} {task}, but weight checkpoint was not found at {path}."
            }

    def get_yolo_info(self):
        yolo_path = self.models_dir / "yolo" / "produce_yolo.pt"
        if yolo_path.exists():
            return {
                "model": "YOLOv8",
                "model_path": str(yolo_path),
                "model_status": "AVAILABLE",
                "confidence_threshold": 0.50
            }
        else:
            return {
                "model": "YOLOv8-Pretrained",
                "model_status": "PRETRAINED_GENERAL_MODEL",
                "message": "Using pretrained general object detection layer. Custom produce YOLO detector not yet trained."
            }

# Singleton Instance
model_registry = ModelRegistry()

