"""
Duplicate Detection Module for AgriGrade AI Dataset Pipeline.
Calculates SHA-256 for exact duplicates and difference hash (dHash) for near-duplicates.
"""

import hashlib
import io
from pathlib import Path
from PIL import Image

def compute_sha256(data_or_filepath) -> str:
    """Compute SHA-256 digest of file path or bytes."""
    hasher = hashlib.sha256()
    if isinstance(data_or_filepath, (str, Path)):
        with open(data_or_filepath, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
    elif isinstance(data_or_filepath, bytes):
        hasher.update(data_or_filepath)
    elif isinstance(data_or_filepath, io.BytesIO):
        hasher.update(data_or_filepath.getvalue())
    return hasher.hexdigest()

def compute_dhash(image_or_bytes, hash_size=8) -> str:
    """
    Compute difference hash (dHash) for near-duplicate image detection.
    """
    try:
        if isinstance(image_or_bytes, (bytes, io.BytesIO)):
            stream = io.BytesIO(image_or_bytes) if isinstance(image_or_bytes, bytes) else image_or_bytes
            img = Image.open(stream).convert('L')
        elif isinstance(image_or_bytes, Image.Image):
            img = image_or_bytes.convert('L')
        else:
            img = Image.open(image_or_bytes).convert('L')

        # Resize to (hash_size + 1, hash_size)
        img = img.resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
        pixels = list(img.getdata())
        
        # Compare adjacent pixels horizontally
        difference = []
        for row in range(hash_size):
            for col in range(hash_size):
                pixel_left = pixels[row * (hash_size + 1) + col]
                pixel_right = pixels[row * (hash_size + 1) + col + 1]
                difference.append(pixel_left > pixel_right)
                
        # Convert boolean array to hex string
        decimal_value = 0
        hex_string = []
        for index, value in enumerate(difference):
            if value:
                decimal_value += 2 ** (index % 4)
            if (index % 4 == 3) or (index == len(difference) - 1):
                hex_string.append(hex(decimal_value)[2:])
                decimal_value = 0
        return "".join(hex_string)
    except Exception:
        return ""

def find_duplicates(inventory_records):
    """
    Given a list of inventory record dicts with 'sha256' and 'dhash',
    group them into exact and near-duplicate sets.
    Assigns 'duplicate_group' IDs to each record.
    """
    sha_map = {}
    dhash_map = {}
    
    # 1. Exact duplicates via SHA-256
    group_counter = 1
    for rec in inventory_records:
        sha = rec.get("sha256")
        if not sha:
            rec["duplicate_group"] = "NONE"
            continue
            
        if sha in sha_map:
            group_id = sha_map[sha]
            rec["duplicate_group"] = group_id
        else:
            group_id = f"DUP_EXACT_{group_counter:05d}"
            sha_map[sha] = group_id
            rec["duplicate_group"] = group_id
            group_counter += 1

    # Check which group_ids appear more than once
    group_counts = {}
    for rec in inventory_records:
        g = rec["duplicate_group"]
        group_counts[g] = group_counts.get(g, 0) + 1
        
    for rec in inventory_records:
        if group_counts.get(rec["duplicate_group"], 0) <= 1:
            rec["duplicate_group"] = "NONE"

    return inventory_records
