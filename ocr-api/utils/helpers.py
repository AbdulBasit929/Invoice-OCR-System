# utils/helpers.py - Utility Functions

import hashlib
from pathlib import Path
from typing import List


def allowed_file(filename: str, allowed_extensions: List[str]) -> bool:
    """
    Check if file extension is allowed
    
    Args:
        filename: Name of the file
        allowed_extensions: List of allowed extensions (e.g., ['.png', '.jpg'])
    
    Returns:
        bool: True if file extension is allowed
    """
    if not filename:
        return False
    
    file_ext = Path(filename).suffix.lower()
    return file_ext in [ext.lower() for ext in allowed_extensions]


def get_file_hash(file_path: Path, algorithm: str = 'sha256') -> str:
    """
    Calculate hash of a file
    
    Args:
        file_path: Path to the file
        algorithm: Hash algorithm ('md5', 'sha1', 'sha256')
    
    Returns:
        str: Hex digest of the file hash
    """
    hash_func = hashlib.new(algorithm)
    
    with open(file_path, 'rb') as f:
        # Read file in chunks to handle large files
        for chunk in iter(lambda: f.read(4096), b''):
            hash_func.update(chunk)
    
    return hash_func.hexdigest()


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format
    
    Args:
        size_bytes: Size in bytes
    
    Returns:
        str: Formatted size (e.g., '1.5 MB')
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to remove unsafe characters
    
    Args:
        filename: Original filename
    
    Returns:
        str: Sanitized filename
    """
    import re
    
    # Remove path separators and other unsafe characters
    safe_name = re.sub(r'[^\w\s.-]', '', filename)
    safe_name = re.sub(r'\s+', '_', safe_name)
    
    # Limit length
    name_parts = Path(safe_name).stem, Path(safe_name).suffix
    if len(name_parts[0]) > 100:
        safe_name = name_parts[0][:100] + name_parts[1]
    
    return safe_name


def extract_confidence_from_text(text: str) -> float:
    """
    Extract confidence score from OCR text (placeholder)
    
    Args:
        text: OCR extracted text
    
    Returns:
        float: Confidence score (0.0 to 1.0)
    """
    # This is a simple heuristic - you can implement more sophisticated logic
    if not text or not text.strip():
        return 0.0
    
    # Check for common OCR errors or garbled text
    garbled_chars = sum(1 for c in text if not c.isprintable())
    total_chars = len(text)
    
    if total_chars == 0:
        return 0.0
    
    confidence = 1.0 - (garbled_chars / total_chars)
    return max(0.0, min(1.0, confidence))
