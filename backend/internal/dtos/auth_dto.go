package dtos

type LoginRequest struct {
	Phone string `json:"phone" binding:"required"`
	OTP   string `json:"otp,omitempty"`
}

type LoginResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	User         any    `json:"user"` // Use specific user DTO if available
}

type TokenResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
}
