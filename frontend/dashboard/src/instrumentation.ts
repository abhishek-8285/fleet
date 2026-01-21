import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { ConsoleSpanExporter, SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Initialize the tracer
const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
        [SemanticResourceAttributes.SERVICE_NAME]: 'fleetflow-frontend',
    }),
});

// Configure where to send spans
// Use ConsoleExporter for development visibility
if (import.meta.env.DEV) {
    provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
}

// In a real production setup, we'd use OTLP Exporter to a collector
// Note: OTLP HTTP requires a collector accepting HTTP (e.g., port 4318)
const otlpExporter = new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces', // Default OTLP HTTP port
});
provider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));

// Register the provider
provider.register({
    contextManager: new ZoneContextManager(),
});

// Register automatic instrumentations
registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
        getWebAutoInstrumentations({
            // Do not trace too much noise
            '@opentelemetry/instrumentation-fetch': {
                propagateTraceHeaderCorsUrls: [
                    /localhost:8080/, // Backend URL
                ],
                clearTimingResources: true,
            },
            '@opentelemetry/instrumentation-document-load': {},
            '@opentelemetry/instrumentation-user-interaction': {},
        }),
    ],
});

export const tracer = provider.getTracer('fleetflow-frontend-tracer');
