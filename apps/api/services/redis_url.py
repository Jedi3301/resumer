import os
from urllib.parse import urlparse


def get_redis_url() -> str:
    redis_url = os.environ["UPSTASH_REDIS_URL"]
    scheme = urlparse(redis_url).scheme.lower()

    if scheme not in {"redis", "rediss", "unix"}:
        raise ValueError(
            f"UPSTASH_REDIS_URL has scheme '{scheme}' — this looks like the Upstash REST URL. "
            "Celery needs the Redis protocol URL. Go to Upstash Dashboard → your database → "
            "\"Connect\" → copy the URL that starts with 'rediss://'"
        )

    return redis_url