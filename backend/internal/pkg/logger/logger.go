package logger

import (
	"context"
	"log/slog"
	"os"

	"go.opentelemetry.io/otel/trace"
)

var defaultLogger *slog.Logger

func init() {
	opts := &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}
	// Use JSON handler for production-ready structured logging
	handler := slog.NewJSONHandler(os.Stdout, opts)
	defaultLogger = slog.New(handler)
}

// SetLevel sets the global logging level
func SetLevel(level slog.Level) {
	// Re-initialize with new level if needed, for simplicity we just stick to Info for now in this MVP
	// In a full implementation, we'd allow dynamic level switching
}

// WithContext adds trace IDs from the context to the logger
func WithContext(ctx context.Context) *slog.Logger {
	span := trace.SpanFromContext(ctx)
	if !span.SpanContext().IsValid() {
		return defaultLogger
	}

	// Add trace_id and span_id to the log record
	return defaultLogger.With(
		slog.String("trace_id", span.SpanContext().TraceID().String()),
		slog.String("span_id", span.SpanContext().SpanID().String()),
	)
}

// Info logs at Info level
func Info(ctx context.Context, msg string, args ...any) {
	WithContext(ctx).Info(msg, args...)
}

// Error logs at Error level
func Error(ctx context.Context, msg string, args ...any) {
	WithContext(ctx).Error(msg, args...)
}

// Debug logs at Debug level
func Debug(ctx context.Context, msg string, args ...any) {
	WithContext(ctx).Debug(msg, args...)
}

// Warn logs at Warn level
func Warn(ctx context.Context, msg string, args ...any) {
	WithContext(ctx).Warn(msg, args...)
}

// GetLogger returns the underlying slog instance if needed directly
func GetLogger() *slog.Logger {
	return defaultLogger
}
