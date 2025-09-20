package server

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/fleetflow/backend/internal/services"
	pb "github.com/fleetflow/backend/proto/gen"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// AuthServer implements the AuthService gRPC service
type AuthServer struct {
	pb.UnimplementedAuthServiceServer
	services *services.Container
}

// NewAuthServer creates a new AuthServer
func NewAuthServer(services *services.Container) *AuthServer {
	return &AuthServer{
		services: services,
	}
}

// SendOTP sends OTP to phone number
func (s *AuthServer) SendOTP(ctx context.Context, req *pb.SendOTPRequest) (*pb.SendOTPResponse, error) {
	log.Printf("🔐 SendOTP request for phone: %s", req.Phone)

	// Validate input
	if req.Phone == "" {
		return nil, status.Error(codes.InvalidArgument, "phone number is required")
	}

	// Get client IP and user agent from context (mocked for now)
	clientIP := "127.0.0.1"    // Would be extracted from context in production
	userAgent := "gRPC-Client" // Would be extracted from context in production

	// Send OTP via service
	result, err := s.services.AuthService.SendOTP(req.Phone, clientIP, userAgent)
	if err != nil {
		log.Printf("❌ Failed to send OTP: %v", err)
		return nil, status.Error(codes.Internal, "failed to send OTP")
	}

	return &pb.SendOTPResponse{
		Message:   "OTP sent successfully",
		ExpiresAt: timestamppb.New(result.ExpiresAt),
		RequestId: fmt.Sprintf("otp_%d", result.ID), // Generate request ID from OTP record
	}, nil
}

// VerifyOTP verifies OTP and returns JWT tokens
func (s *AuthServer) VerifyOTP(ctx context.Context, req *pb.VerifyOTPRequest) (*pb.AuthResponse, error) {
	log.Printf("🔐 VerifyOTP request for phone: %s", req.Phone)

	// Validate input
	if req.Phone == "" || req.Otp == "" {
		return nil, status.Error(codes.InvalidArgument, "phone and OTP are required")
	}

	// Get client IP and user agent from context (mocked for now)
	clientIP := "127.0.0.1"    // Would be extracted from context in production
	userAgent := "gRPC-Client" // Would be extracted from context in production

	// Verify OTP via service
	userAccount, err := s.services.AuthService.VerifyOTP(req.Phone, req.Otp, clientIP, userAgent)
	if err != nil {
		log.Printf("❌ OTP verification failed: %v", err)

		if errors.Is(err, services.ErrInvalidOTP) {
			return nil, status.Error(codes.Unauthenticated, "invalid or expired OTP")
		}
		return nil, status.Error(codes.Internal, "OTP verification failed")
	}

	// Generate JWT tokens (mocked for now)
	accessToken := fmt.Sprintf("jwt_access_%d", userAccount.ID)
	refreshToken := fmt.Sprintf("jwt_refresh_%d", userAccount.ID)

	// Convert user to protobuf
	userProfile := &pb.UserProfile{
		Id:        uint32(userAccount.ID),
		Phone:     userAccount.Phone,
		Role:      convertUserRole(string(userAccount.Role)),
		IsActive:  userAccount.IsActive,
		CreatedAt: timestamppb.New(userAccount.CreatedAt),
	}

	// Handle LastLogin pointer
	if userAccount.LastLogin != nil {
		userProfile.LastLogin = timestamppb.New(*userAccount.LastLogin)
	}

	// Add driver info if user is a driver
	if userAccount.DriverID != nil {
		userProfile.DriverId = uint32(*userAccount.DriverID)
		// Get driver info (simplified for now)
		userProfile.Driver = &pb.DriverInfo{
			Id:     uint32(*userAccount.DriverID),
			Name:   "Driver Name", // Would fetch from driver service
			Status: pb.DriverStatus_DRIVER_STATUS_AVAILABLE,
			Rating: 4.5,
		}
	}

	return &pb.AuthResponse{
		Message:      "Authentication successful",
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    3600, // 1 hour
		User:         userProfile,
	}, nil
}

// RefreshToken refreshes access token
func (s *AuthServer) RefreshToken(ctx context.Context, req *pb.RefreshTokenRequest) (*pb.AuthResponse, error) {
	log.Printf("🔐 RefreshToken request")

	if req.RefreshToken == "" {
		return nil, status.Error(codes.InvalidArgument, "refresh token is required")
	}

	// Mock token refresh - in production would validate and regenerate tokens
	accessToken := fmt.Sprintf("jwt_access_refreshed_%d", 12345)
	refreshToken := fmt.Sprintf("jwt_refresh_refreshed_%d", 12345)

	// Mock user data
	userProfile := &pb.UserProfile{
		Id:        12345,
		Phone:     "+1234567890",
		Role:      pb.UserRole_USER_ROLE_ADMIN,
		IsActive:  true,
		CreatedAt: timestamppb.Now(),
	}

	return &pb.AuthResponse{
		Message:      "Token refreshed successfully",
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    3600,
		User:         userProfile,
	}, nil
}

// Logout revokes tokens
func (s *AuthServer) Logout(ctx context.Context, req *pb.LogoutRequest) (*pb.SuccessResponse, error) {
	log.Printf("🔐 Logout request")

	if req.RefreshToken == "" {
		return nil, status.Error(codes.InvalidArgument, "refresh token is required")
	}

	// Mock logout - in production would revoke tokens

	return &pb.SuccessResponse{
		Message: "Logged out successfully",
		Success: true,
	}, nil
}

// GetProfile gets user profile
func (s *AuthServer) GetProfile(ctx context.Context, req *pb.GetProfileRequest) (*pb.UserProfile, error) {
	log.Printf("🔐 GetProfile request")

	// Mock user profile - in production would get from auth middleware and database
	userProfile := &pb.UserProfile{
		Id:        12345,
		Phone:     "+1234567890",
		Role:      pb.UserRole_USER_ROLE_ADMIN,
		IsActive:  true,
		CreatedAt: timestamppb.Now(),
	}

	return userProfile, nil
}

// UpdateProfile updates user profile (limited for OTP-based auth)
func (s *AuthServer) UpdateProfile(ctx context.Context, req *pb.UpdateProfileRequest) (*pb.UserProfile, error) {
	log.Printf("🔐 UpdateProfile request")

	// Mock profile update - in production would update database
	userProfile := &pb.UserProfile{
		Id:        12345,
		Phone:     "+1234567890",
		Role:      pb.UserRole_USER_ROLE_ADMIN,
		IsActive:  true,
		CreatedAt: timestamppb.Now(),
	}

	return userProfile, nil
}

// GetUsers gets all users (admin only)
func (s *AuthServer) GetUsers(ctx context.Context, req *pb.GetUsersRequest) (*pb.GetUsersResponse, error) {
	log.Printf("🔐 GetUsers request")

	// Mock admin check and user list
	mockUsers := []*pb.UserProfile{
		{
			Id:        12345,
			Phone:     "+1234567890",
			Role:      pb.UserRole_USER_ROLE_ADMIN,
			IsActive:  true,
			CreatedAt: timestamppb.Now(),
		},
		{
			Id:        12346,
			Phone:     "+1234567891",
			Role:      pb.UserRole_USER_ROLE_DRIVER,
			IsActive:  true,
			CreatedAt: timestamppb.Now(),
		},
	}

	return &pb.GetUsersResponse{
		Users: mockUsers,
		Pagination: &pb.Pagination{
			Page:       1,
			Limit:      20,
			Total:      2,
			TotalPages: 1,
		},
	}, nil
}

// CreateUser creates a new user (admin only)
func (s *AuthServer) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.UserProfile, error) {
	log.Printf("🔐 CreateUser request for phone: %s", req.Phone)

	// Mock user creation
	if req.Phone == "" {
		return nil, status.Error(codes.InvalidArgument, "phone number is required")
	}

	return &pb.UserProfile{
		Id:        54321,
		Phone:     req.Phone,
		Role:      req.Role,
		IsActive:  true,
		CreatedAt: timestamppb.Now(),
	}, nil
}

// UpdateUser updates a user (admin only)
func (s *AuthServer) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UserProfile, error) {
	log.Printf("🔐 UpdateUser request for ID: %d", req.Id)

	// Mock user update
	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "user ID is required")
	}

	return &pb.UserProfile{
		Id:        req.Id,
		Phone:     "+1234567890", // Mock phone since req doesn't have Phone field
		Role:      req.Role,
		IsActive:  req.IsActive,
		CreatedAt: timestamppb.Now(),
	}, nil
}

// DeleteUser deletes a user (admin only)
func (s *AuthServer) DeleteUser(ctx context.Context, req *pb.DeleteUserRequest) (*pb.SuccessResponse, error) {
	log.Printf("🔐 DeleteUser request for ID: %d", req.Id)

	// Mock user deletion
	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "user ID is required")
	}

	return &pb.SuccessResponse{
		Message: "User deleted successfully",
		Success: true,
	}, nil
}

// Helper functions

func (s *AuthServer) checkAdminPermissions(ctx context.Context) error {
	userRole, err := getUserRoleFromContext(ctx)
	if err != nil {
		return status.Error(codes.Unauthenticated, "authentication required")
	}

	if userRole != "admin" {
		return status.Error(codes.PermissionDenied, "admin access required")
	}

	return nil
}

// Convert between internal and protobuf enums
func convertUserRole(role string) pb.UserRole {
	switch role {
	case "admin":
		return pb.UserRole_USER_ROLE_ADMIN
	case "driver":
		return pb.UserRole_USER_ROLE_DRIVER
	default:
		return pb.UserRole_USER_ROLE_UNSPECIFIED
	}
}

func convertPBUserRole(role pb.UserRole) string {
	switch role {
	case pb.UserRole_USER_ROLE_ADMIN:
		return "admin"
	case pb.UserRole_USER_ROLE_DRIVER:
		return "driver"
	default:
		return ""
	}
}

func convertDriverStatus(status string) pb.DriverStatus {
	switch status {
	case "available":
		return pb.DriverStatus_DRIVER_STATUS_AVAILABLE
	case "on_trip":
		return pb.DriverStatus_DRIVER_STATUS_ON_TRIP
	case "on_break":
		return pb.DriverStatus_DRIVER_STATUS_ON_BREAK
	case "offline":
		return pb.DriverStatus_DRIVER_STATUS_OFFLINE
	case "maintenance":
		return pb.DriverStatus_DRIVER_STATUS_MAINTENANCE
	default:
		return pb.DriverStatus_DRIVER_STATUS_UNSPECIFIED
	}
}

// Mock context helper functions (would be implemented by auth middleware)
func getUserIDFromContext(ctx context.Context) (uint, error) {
	// This would be set by the auth middleware after validating JWT
	if userID := ctx.Value("user_id"); userID != nil {
		if id, ok := userID.(uint); ok {
			return id, nil
		}
	}
	return 0, errors.New("user ID not found in context")
}

func getUserRoleFromContext(ctx context.Context) (string, error) {
	// This would be set by the auth middleware after validating JWT
	if userRole := ctx.Value("user_role"); userRole != nil {
		if role, ok := userRole.(string); ok {
			return role, nil
		}
	}
	return "", errors.New("user role not found in context")
}
