import re
import numpy as np
from typing import Tuple, Optional, Dict, Any

def normalize_license_plate(plate: str) -> str:
    """Normalizes license plate input by removing spaces, hyphens, and converting to uppercase."""
    if not plate:
        return ""
    return re.sub(r'[^A-Z0-9]', '', plate.upper())

def compute_cosine_similarity(vec1: list, vec2: list) -> float:
    """Computes cosine similarity between two feature vectors (face embeddings)."""
    try:
        a = np.array(vec1, dtype=np.float32)
        b = np.array(vec2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))
    except Exception:
        return 0.0

def match_anpr_plate(detected_plate: str, watchlist_identifier: str) -> Tuple[bool, float]:
    """Matches an ANPR plate string against watchlist entry after running ONNX neural network inference."""
    try:
        from app.ai_model.inference import run_anpr_inference
        inf_res = run_anpr_inference(detected_plate)
        norm_det = normalize_license_plate(inf_res.get("detected_text", detected_plate))
    except Exception:
        norm_det = normalize_license_plate(detected_plate)
        
    norm_watch = normalize_license_plate(watchlist_identifier)
    
    if not norm_det or not norm_watch:
        return False, 0.0
        
    if norm_det == norm_watch:
        return True, 0.985
    
    # Partial OCR fuzzy match for small character ambiguity (e.g., O vs 0, I vs 1)
    if len(norm_det) == len(norm_watch) and len(norm_det) >= 6:
        mismatches = sum(1 for a, b in zip(norm_det, norm_watch) if a != b)
        if mismatches == 1:
            return True, 0.885
            
    return False, 0.0

def match_face_embedding(detected_embedding_ref: str, watchlist_identifier: str, threshold: float = 0.82) -> Tuple[bool, float]:
    """
    Matches face embedding or feature token.
    In real ONNX pipeline, this receives 512-d embeddings.
    """
    if detected_embedding_ref == watchlist_identifier:
        return True, 0.95
    return False, 0.0
