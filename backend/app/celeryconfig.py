from kombu import Exchange, Queue
import os

REDIS = os.getenv("REDIS_URL", "redis://localhost:6379/0")

broker_url = REDIS
result_backend = REDIS

task_queues = (
    Queue("default", Exchange("default"), routing_key="default"),
)

task_default_queue = "default"
task_default_exchange = "default"
task_default_routing_key = "default"

accept_content = ["json"]
task_serializer = "json"
result_serializer = "json"
timezone = "UTC"
enable_utc = True
