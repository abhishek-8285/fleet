package utils

import (
	"regexp"
	"strings"
)

// Security validation functions for all APIs

// IsValidIndianPhone validates Indian phone number format
func IsValidIndianPhone(phone string) bool {
	// Indian phone number regex: +91 followed by 10 digits starting with 6-9
	pattern := `^\+91[6-9]\d{9}$`
	matched, _ := regexp.MatchString(pattern, phone)
	return matched
}

// ContainsXSS checks for XSS attack patterns
func ContainsXSS(input string) bool {
	xssPatterns := []string{
		"<script",
		"</script>",
		"javascript:",
		"onload=",
		"onerror=",
		"onclick=",
		"<img",
		"<iframe",
		"eval(",
		"document.cookie",
	}

	inputLower := strings.ToLower(input)
	for _, pattern := range xssPatterns {
		if strings.Contains(inputLower, pattern) {
			return true
		}
	}
	return false
}

// ContainsSQLInjection checks for SQL injection patterns
func ContainsSQLInjection(input string) bool {
	sqlPatterns := []string{
		"'or 1=1",
		"'; drop",
		"union select",
		"insert into",
		"delete from",
		"update set",
		"exec(",
		"xp_",
		"--",
		"/*",
		"*/",
	}

	inputLower := strings.ToLower(input)
	for _, pattern := range sqlPatterns {
		if strings.Contains(inputLower, pattern) {
			return true
		}
	}
	return false
}

// ContainsCommandInjection checks for shell command injection patterns
func ContainsCommandInjection(input string) bool {
	commandPatterns := []string{
		"; rm ",
		"&& rm ",
		"| rm ",
		"; cat ",
		"&& cat ",
		"| cat ",
		"; ls ",
		"; echo ",
		"$( ",
		"` ",
	}

	inputLower := strings.ToLower(input)
	for _, pattern := range commandPatterns {
		if strings.Contains(inputLower, pattern) {
			return true
		}
	}
	return false
}

// ContainsPathTraversal checks for path traversal patterns
func ContainsPathTraversal(input string) bool {
	patterns := []string{
		"../",
		"..\\",
		"/etc/passwd",
		"c:\\windows",
	}

	for _, pattern := range patterns {
		if strings.Contains(input, pattern) {
			return true
		}
	}
	return false
}

// IsValidLicenseNumber validates Indian driving license format
func IsValidLicenseNumber(license string) bool {
	// Indian license format: State(2-3 chars) + numbers
	pattern := `^[A-Z]{2,3}\d{13,16}$`
	matched, _ := regexp.MatchString(pattern, license)
	return matched
}

// IsValidLicensePlate validates Indian license plate formats
func IsValidLicensePlate(plate string) bool {
	// Indian license plate formats
	patterns := []string{
		`^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$`, // Old format: MH01AB1234
		`^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$`,   // New format: MH12BH1234
	}

	for _, pattern := range patterns {
		matched, _ := regexp.MatchString(pattern, plate)
		if matched {
			return true
		}
	}
	return false
}

// ValidateBusinessRules validates business logic constraints
func ValidateCargoWeight(weight float64, vehicleType string) bool {
	maxWeights := map[string]float64{
		"BIKE":  50,    // 50 kg max for bikes
		"CAR":   500,   // 500 kg max for cars
		"VAN":   3000,  // 3 tons max for vans
		"TRUCK": 25000, // 25 tons max for trucks
	}

	maxWeight, exists := maxWeights[vehicleType]
	if !exists {
		return false // Unknown vehicle type
	}

	return weight > 0 && weight <= maxWeight
}

// ValidateFuelAmount validates fuel-related amounts
func ValidateFuelAmount(liters, pricePerLiter, totalAmount float64) bool {
	// Basic validation
	if liters <= 0 || liters > 1000 {
		return false // Invalid fuel quantity
	}

	if pricePerLiter < 50 || pricePerLiter > 200 {
		return false // Invalid price range for India
	}

	// Check if calculation is approximately correct (allow 1% variance)
	expectedTotal := liters * pricePerLiter
	variance := abs(totalAmount - expectedTotal)
	return variance <= (expectedTotal * 0.01)
}

// Helper function
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
