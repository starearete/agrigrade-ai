"""
Fast Image Validation Module for AgriGrade AI Dataset Pipeline.
Verifies image integrity, resolution, format, color space, and detects corruption.
"""

import io
from pathlib import Path
from PIL import Image

def validate_image_file(image_path_or_bytes, filename=None):
    """
    Validate an image file or byte stream.
    Returns dict with image properties or error status.
    """
    result = {
        "valid": False,
        "width": 0,
        "height": 0,
        "format": "UNKNOWN",
        "mode": "UNKNOWN",
        "file_size": 0,
        "corrupt": False,
        "error_message": None
    }

    try:
        if isinstance(image_path_or_bytes, (str, Path)):
            p = Path(image_path_or_bytes)
            if not p.exists():
                result["error_message"] = "File does not exist"
                result["corrupt"] = True
                return result
            result["file_size"] = p.stat().st_size
            if result["file_size"] == 0:
                result["error_message"] = "Zero byte file"
                result["corrupt"] = True
                return result
            
            with Image.open(p) as img:
                result["width"] = img.width
                result["height"] = img.height
                result["format"] = img.format or p.suffix.lstrip('.').upper()
                result["mode"] = img.mode
                result["valid"] = True

        elif isinstance(image_path_or_bytes, (bytes, io.BytesIO)):
            raw_bytes = image_path_or_bytes if isinstance(image_path_or_bytes, bytes) else image_path_or_bytes.getvalue()
            result["file_size"] = len(raw_bytes)
            if result["file_size"] == 0:
                result["error_message"] = "Zero byte buffer"
                result["corrupt"] = True
                return result
            
            stream = io.BytesIO(raw_bytes)
            with Image.open(stream) as img:
                result["width"] = img.width
                result["height"] = img.height
                ext = Path(filename).suffix.lstrip('.').upper() if filename else 'UNKNOWN'
                result["format"] = img.format or ext
                result["mode"] = img.mode
                result["valid"] = True

    except Exception as e:
        result["valid"] = False
        result["corrupt"] = True
        result["error_message"] = str(e)

    return result
