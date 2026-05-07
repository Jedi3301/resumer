import os
from urllib.parse import urlparse


def get_redis_url(default: str = "redis://redis:6379/0") -> str:
    redis_url = os.getenv("UPSTASH_REDIS_URL", default)
    scheme = urlparse(redis_url).scheme.lower()

    if scheme in {"redis", "rediss", "unix"}:
        return redis_url

    return default