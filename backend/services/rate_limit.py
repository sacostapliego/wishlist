import math
import threading
import time
from collections import deque
from typing import Callable, Deque, Dict

from fastapi import HTTPException, Request

# Sweep expired keys once this many are tracked, so an attacker cycling through
# addresses cannot grow the table forever.
MAX_TRACKED_KEYS = 50_000

class RateLimiter:
    """
    A sliding window held in this process's memory. Enough for one API instance;
    it resets on restart, and running several instances needs a shared store such
    as Redis, because each would otherwise count separately.
    """

    def __init__(self):
        self._expiries: Dict[str, Deque[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str, limit: int) -> None:
        """Raises 429 when `key` has used up its limit."""
        now = time.monotonic()
        with self._lock:
            expiries = self._expiries.get(key)
            if not expiries:
                return

            while expiries and expiries[0] <= now:
                expiries.popleft()

            if len(expiries) >= limit:
                retry_after = max(1, math.ceil(expiries[0] - now))
                raise HTTPException(
                    status_code=429,
                    detail='Too many attempts. Please try again later',
                    headers={'Retry-After': str(retry_after)}
                )

    def record(self, key: str, window_seconds: int) -> None:
        now = time.monotonic()
        with self._lock:
            if len(self._expiries) >= MAX_TRACKED_KEYS:
                self._expiries = {
                    k: v for k, v in self._expiries.items() if v and v[-1] > now
                }
            self._expiries.setdefault(key, deque()).append(now + window_seconds)

    def reset(self) -> None:
        with self._lock:
            self._expiries.clear()

limiter = RateLimiter()

def client_ip(request: Request) -> str:
    """
    The caller's address. Render sits behind Cloudflare, which overwrites these
    two headers. X-Forwarded-For is a fallback only because a client can set its
    first entry itself, and because without any header every visitor would share
    the proxy's address and one bucket.
    """
    ip = request.headers.get('true-client-ip') or request.headers.get('cf-connecting-ip')
    if ip:
        return ip.strip()

    forwarded_for = request.headers.get('x-forwarded-for')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()

    return request.client.host if request.client else 'unknown'

def rate_limit(name: str, limit: int, window_seconds: int) -> Callable[[Request], None]:
    """FastAPI dependency: allows `limit` calls per client per window."""
    def dependency(request: Request) -> None:
        key = f'{name}:{client_ip(request)}'
        limiter.check(key, limit)
        limiter.record(key, window_seconds)

    return dependency
