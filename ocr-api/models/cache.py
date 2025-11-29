# models/cache.py - Enhanced OCR Cache

import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class EnhancedOCRCache:
    """Improved cache with better security and performance"""
    
    def __init__(
        self, 
        cache_dir: str = "/tmp/.ocr_cache", 
        ttl_hours: int = 24,
        max_cache_size_mb: int = 500
    ):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.memory_cache = {}
        self.ttl_seconds = ttl_hours * 3600
        self.max_cache_size = max_cache_size_mb * 1024 * 1024
        
    def _get_cache_path(self, key: str) -> Path:
        """Get file path for cache key"""
        return self.cache_dir / f"{key}.json"
    
    def get_key(self, image_path: str, config) -> str:
        """Generate secure cache key using SHA-256"""
        file_stat = Path(image_path).stat()
        
        key_data = (
            f"{image_path}_"
            f"{file_stat.st_mtime}_"
            f"{file_stat.st_size}_"
            f"{config.proximity_threshold}_"
            f"{config.row_tolerance}_"
            f"{config.extraction_model}"
        )
        
        return hashlib.sha256(key_data.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Dict]:
        """Retrieve cached result with validation"""
        # Check memory cache
        if key in self.memory_cache:
            cached_data, timestamp = self.memory_cache[key]
            if (datetime.now() - timestamp).total_seconds() < self.ttl_seconds:
                logger.debug(f"Cache hit (memory): {key[:8]}...")
                return cached_data
            else:
                del self.memory_cache[key]
        
        # Check file cache
        cache_path = self._get_cache_path(key)
        if cache_path.exists():
            try:
                file_age = datetime.now().timestamp() - cache_path.stat().st_mtime
                if file_age > self.ttl_seconds:
                    cache_path.unlink()
                    return None
                
                with open(cache_path, 'r') as f:
                    cached = json.load(f)
                
                cached_time = datetime.fromisoformat(cached['timestamp'])
                
                if (datetime.now() - cached_time).total_seconds() < self.ttl_seconds:
                    logger.info(f"Cache hit (disk): {key[:8]}...")
                    data = cached['data']
                    
                    if 'processed_image' in data:
                        del data['processed_image']
                    
                    self.memory_cache[key] = (data, cached_time)
                    return data
                else:
                    cache_path.unlink()
                    
            except (json.JSONDecodeError, KeyError, ValueError) as e:
                logger.warning(f"Cache corruption detected: {e}")
                cache_path.unlink()
            except Exception as e:
                logger.warning(f"Cache read error: {e}")
        
        return None
    
    def set(self, key: str, value: Dict):
        """Store result in cache with size management"""
        self._manage_cache_size()
        
        timestamp = datetime.now()
        
        cache_value = value.copy()
        if 'processed_image' in cache_value:
            del cache_value['processed_image']
        
        self.memory_cache[key] = (cache_value, timestamp)
        
        try:
            cache_path = self._get_cache_path(key)
            cache_data = {
                'timestamp': timestamp.isoformat(),
                'data': cache_value,
                'version': '2.0'
            }
            
            with open(cache_path, 'w') as f:
                json.dump(cache_data, f, separators=(',', ':'))
            
            logger.debug(f"Cached result: {key[:8]}...")
        except Exception as e:
            logger.warning(f"Cache write error: {e}")
    
    def _manage_cache_size(self):
        """Remove old cache files if size limit exceeded"""
        total_size = sum(
            f.stat().st_size 
            for f in self.cache_dir.glob("*.json")
        )
        
        if total_size > self.max_cache_size:
            cache_files = sorted(
                self.cache_dir.glob("*.json"),
                key=lambda p: p.stat().st_mtime
            )
            
            for cache_file in cache_files:
                try:
                    size = cache_file.stat().st_size
                    cache_file.unlink()
                    total_size -= size
                    if total_size <= self.max_cache_size * 0.8:
                        break
                except Exception as e:
                    logger.warning(f"Error removing cache file: {e}")
    
    def clear(self):
        """Clear all cache"""
        self.memory_cache.clear()
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                cache_file.unlink()
            except Exception as e:
                logger.warning(f"Error clearing cache file: {e}")
        logger.info("Cache cleared")
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        cache_files = list(self.cache_dir.glob("*.json"))
        total_size = sum(f.stat().st_size for f in cache_files)
        
        return {
            'total_files': len(cache_files),
            'total_size_mb': total_size / (1024 * 1024),
            'memory_cache_entries': len(self.memory_cache),
            'cache_directory': str(self.cache_dir)
        }
