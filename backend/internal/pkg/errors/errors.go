package errors

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/fleetflow/backend/internal/pkg/logger"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

// ErrorType defines the category of the error
type ErrorType string

const (
	ErrorTypeUser     ErrorType = "user"
	ErrorTypeSystem   ErrorType = "system"
	ErrorTypeExternal ErrorType = "external"
)

// AppError is a structured error type
type AppError struct {
	Type    ErrorType
	Message string
	Err     error
	Code    int // HTTP status code or internal error code
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Type, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s] %s", e.Type, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// NewUserError creates a new error caused by invalid user input
func NewUserError(msg string, err error) *AppError {
	return &AppError{
		Type:    ErrorTypeUser,
		Message: msg,
		Err:     err,
		Code:    http.StatusBadRequest,
	}
}

// NewSystemError creates a new error caused by internal system failure
func NewSystemError(msg string, err error) *AppError {
	return &AppError{
		Type:    ErrorTypeSystem,
		Message: msg,
		Err:     err,
		Code:    http.StatusInternalServerError,
	}
}

// HandleError processes the error: logs it effectively and sets trace status
func HandleError(ctx context.Context, err error, msg string) {
	if err == nil {
		return
	}

	span := trace.SpanFromContext(ctx)
	span.RecordError(err)
	span.SetStatus(codes.Error, msg)

	// Determine if it's a known AppError
	var appErr *AppError
	if errors.As(err, &appErr) {
		// Log based on error type
		if appErr.Type == ErrorTypeSystem || appErr.Type == ErrorTypeExternal {
			logger.Error(ctx, msg, "error", appErr.Error(), "type", appErr.Type)
		} else {
			// User errors might just be warnings or info, depending on noise preference
			// For now, let's log them as Warn
			logger.Warn(ctx, msg, "error", appErr.Error(), "type", appErr.Type)
		}
	} else {
		// Unknown error, treat as System error
		logger.Error(ctx, msg, "error", err.Error(), "type", "unknown")
	}
}
