import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const enabled = process.env.ENABLE_TRACING === 'true';

let sdk = null;
if (enabled) {
  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || undefined,
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS || undefined,
  });

  sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
    serviceName: process.env.OTEL_SERVICE_NAME || 'ai-dev-platform',
  });

  sdk.start().then(() => {
    console.log('[otel] tracing started');
  }).catch((err) => console.error('[otel] failed to start', err));
}

export default sdk;
