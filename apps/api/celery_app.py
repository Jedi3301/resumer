from celery import Celery
from services.redis_url import get_redis_url

try:
    redis_url = get_redis_url()
except Exception as e:
    import sys
    print(f"[celery_app] WARNING: Redis configuration error: {e}", file=sys.stderr)
    print("[celery_app] App will start but task dispatch will fail until Redis is configured.", file=sys.stderr)
    redis_url = "redis://localhost:6379/0"  # fallback — app still starts

celery_app = Celery(
    "job_copilot",
    broker=redis_url,
    backend=redis_url
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
