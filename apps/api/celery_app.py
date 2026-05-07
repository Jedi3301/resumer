import os
from celery import Celery

redis_url = os.environ.get("UPSTASH_REDIS_URL", "redis://redis:6379/0")
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
