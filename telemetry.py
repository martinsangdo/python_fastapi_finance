from prometheus_client import start_http_server
from opentelemetry import trace, metrics
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
    OTLPSpanExporter,
)
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.prometheus import (
    PrometheusMetricReader,
)
from opentelemetry.instrumentation.fastapi import (
    FastAPIInstrumentor,
)
from opentelemetry.instrumentation.pymongo import (
    PymongoInstrumentor,
)

def setup_telemetry(app):
    resource = Resource.create({
        "service.name": "fastapi-mvc-app"
    })
    # =========================
    # TRACE
    # =========================
    tracer_provider = TracerProvider(
        resource=resource
    )
    otlp_exporter = OTLPSpanExporter(
        endpoint="localhost:4317",
        insecure=True
    )
    tracer_provider.add_span_processor(
        BatchSpanProcessor(otlp_exporter)
    )
    trace.set_tracer_provider(
        tracer_provider
    )
    # =========================
    # METRICS
    # =========================
    reader = PrometheusMetricReader()
    meter_provider = MeterProvider(
        resource=resource,
        metric_readers=[reader]
    )
    metrics.set_meter_provider(
        meter_provider
    )
    start_http_server(port=8001)
    # =========================
    # INSTRUMENTATION
    # =========================
    FastAPIInstrumentor.instrument_app(app)
    PymongoInstrumentor().instrument()