import ssl
from celery import Celery
from services.redis_url import get_redis_url

try:
    redis_url = get_redis_url()
except Exception as e:
    import sys
    print(f"[celery_app] WARNING: Redis configuration error: {e}", file=sys.stderr)
    redis_url = "redis://localhost:6379/0"

celery_app = Celery(
    "job_copilot",
    broker=redis_url,
    backend=redis_url
)

# Required for Upstash rediss:// TLS connections
_ssl_config = {"ssl_cert_reqs": ssl.CERT_NONE} if redis_url.startswith("rediss://") else {}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_use_ssl=_ssl_config or None,
    redis_backend_use_ssl=_ssl_config or None,
)
