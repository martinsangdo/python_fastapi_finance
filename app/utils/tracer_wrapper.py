# In a new file like utils/telemetry.py
from opentelemetry import trace
import functools

tracer = trace.get_tracer(__name__)

def trace_function(name=None):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            span_name = name or func.__name__
            with tracer.start_as_current_span(span_name):
                return await func(*args, **kwargs)
        return wrapper
    return decorator