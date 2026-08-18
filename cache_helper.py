import time
import threading

class InMemoryCache:
    def __init__(self, default_ttl=300, max_size=1024):
        self.default_ttl = default_ttl
        self.max_size = max_size
        self._store = {}
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0

    def set(self, key, value, ttl=None):
        ttl = ttl if ttl is not None else self.default_ttl
        expiry = time.time() + ttl
        with self._lock:
            # Enforce max size limit
            if len(self._store) >= self.max_size and key not in self._store:
                # Remove oldest expired or just any arbitrary key to stay under limit
                oldest_key = None
                oldest_expiry = float('inf')
                for k, (_, exp) in self._store.items():
                    if exp < oldest_expiry:
                        oldest_expiry = exp
                        oldest_key = k
                if oldest_key:
                    self._store.pop(oldest_key, None)
            
            self._store[key] = (value, expiry)

    def get(self, key):
        now = time.time()
        with self._lock:
            if key in self._store:
                val, expiry = self._store[key]
                if now < expiry:
                    self.hits += 1
                    return val
                else:
                    self._store.pop(key, None)
            self.misses += 1
            return None

    def clear(self):
        with self._lock:
            self._store.clear()
            self.hits = 0
            self.misses = 0

    def size(self):
        now = time.time()
        with self._lock:
            # Clean expired items on size query
            expired = [k for k, (_, exp) in self._store.items() if now >= exp]
            for k in expired:
                self._store.pop(k, None)
            return len(self._store)

# Global in-memory cache registry
settings_cache = InMemoryCache(default_ttl=600)      # cache settings for 10 minutes
categories_cache = InMemoryCache(default_ttl=120)    # cache categories for 2 minutes
tags_cache = InMemoryCache(default_ttl=120)          # cache tags list for 2 minutes
stats_cache = InMemoryCache(default_ttl=60)          # cache stats summary for 1 minute
activity_cache = InMemoryCache(default_ttl=60)       # caches user last DB activity update to prevent write spam

def clear_note_caches():
    """Clear all caches that store note-dependent counters and data."""
    categories_cache.clear()
    stats_cache.clear()
    tags_cache.clear()

