from celery import Celery
from services.redis_url import get_redis_url

redis_url = get_redis_url()
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
