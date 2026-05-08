import os
from urllib.parse import urlparse


def get_redis_url() -> str:
    # Support both UPSTASH_REDIS_URL and REDIS_URL env var names
    redis_url = os.environ.get("UPSTASH_REDIS_URL") or os.environ.get("REDIS_URL")

    if not redis_url:
        raise EnvironmentError(
            "No Redis URL configured. Set UPSTASH_REDIS_URL in your environment. "
            "Use the 'rediss://' connection string from your Upstash dashboard."
        )

    scheme = urlparse(redis_url).scheme.lower()

    if scheme not in {"redis", "rediss", "unix"}:
        raise ValueError(
            f"UPSTASH_REDIS_URL has scheme '{scheme}' — this is the Upstash REST URL. "
            "Celery needs the Redis protocol URL starting with 'rediss://'. "
            "Go to Upstash Dashboard → your database → Connect → copy the rediss:// URL."
        )

    return redis_url