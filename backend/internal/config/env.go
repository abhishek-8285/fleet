package config

import (
	"fmt"
	"os"
	"strconv"
)

// MustEnv retrieves an environment variable or panics if not set
func MustEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic(fmt.Sprintf("FATAL: Required environment variable %s is not set", key))
	}
	return value
}

// GetEnv retrieves an environment variable with a default fallback
func GetEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// GetEnvInt retrieves an integer environment variable with default
func GetEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	intVal, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return intVal
}

// GetEnvBool retrieves a boolean environment variable with default
func GetEnvBool(key string, defaultValue bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value == "true" || value == "1"
}

// ValidateRequiredEnv validates all critical environment variables at startup
func ValidateRequiredEnv() error {
	required := []string{
		"DATABASE_URL",
		"JWT_SECRET",
	}

	var missing []string
	for _, key := range required {
		if os.Getenv(key) == "" {
			missing = append(missing, key)
		}
	}

	if len(missing) > 0 {
		return fmt.Errorf("FATAL: Missing required environment variables: %v", missing)
	}

	return nil
}
