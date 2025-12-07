package server

import (
	"fmt"
	// "io"
	"log"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	pb "github.com/fleetflow/backend/proto/gen"

	// "google.golang.org/grpc/codes"
	// "google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// UploadServer implements the UploadService gRPC service
type UploadServer struct {
	pb.UnimplementedUploadServiceServer
	services *services.Container
}

// NewUploadServer creates a new UploadServer
func NewUploadServer(services *services.Container) *UploadServer {
	return &UploadServer{
		services: services,
	}
}

// UploadFuelReceipt handles fuel receipt upload streaming
func (s *UploadServer) UploadFuelReceipt(stream pb.UploadService_UploadFuelReceiptServer) error {
	log.Printf("📤 UploadFuelReceipt stream started")

	// TODO: Implement when protobuf definitions are updated
	log.Printf("📋 UploadFuelReceipt - mock implementation")

	// TODO: Upload file via service when UploadFile method is implemented
	log.Printf("✅ Mock fuel receipt upload completed")

	// Send mock response
	return stream.SendAndClose(&pb.UploadResponse{
		Success: true,
		Message: "Fuel receipt uploaded successfully (mock)",
	})
}

// UploadPOD handles POD upload streaming
func (s *UploadServer) UploadPOD(stream pb.UploadService_UploadPODServer) error {
	log.Printf("📤 UploadPOD stream started")

	// TODO: Implement when protobuf definitions are updated
	log.Printf("📋 UploadPOD - mock implementation")

	// Send mock response
	return stream.SendAndClose(&pb.UploadResponse{
		Success: true,
		Message: "POD uploaded successfully (mock)",
	})
}

// UploadDocument handles document upload streaming
func (s *UploadServer) UploadDocument(stream pb.UploadService_UploadDocumentServer) error {
	log.Printf("📤 UploadDocument stream started")

	// TODO: Implement when protobuf definitions are updated
	log.Printf("📋 UploadDocument - mock implementation")

	// Send mock response
	return stream.SendAndClose(&pb.UploadResponse{
		Success: true,
		Message: "Document uploaded successfully (mock)",
	})
}

// StreamUploadProgress streams upload progress
func (s *UploadServer) StreamUploadProgress(req *pb.StreamUploadProgressRequest, stream pb.UploadService_StreamUploadProgressServer) error {
	log.Printf("📤 StreamUploadProgress request")

	// TODO: Implement when protobuf definitions and service methods are updated
	log.Printf("📋 StreamUploadProgress - mock implementation")

	return nil
}

// StreamOCRResults streams OCR results
func (s *UploadServer) StreamOCRResults(req *pb.StreamOCRResultsRequest, stream pb.UploadService_StreamOCRResultsServer) error {
	log.Printf("📤 StreamOCRResults request")

	// TODO: Implement when protobuf definitions and service methods are updated
	log.Printf("📋 StreamOCRResults - mock implementation")

	return nil
}

// Helper functions

func convertUploadToProto(upload *models.Upload) *pb.Upload {
	pbUpload := &pb.Upload{
		Id:           uint32(upload.ID),
		FileName:     upload.FileName,
		OriginalName: upload.OriginalName,
		ContentType:  upload.ContentType,
		FileSize:     upload.FileSize,
		FilePath:     upload.FilePath,
		PublicUrl:    upload.PublicURL,
		UploadType:   convertFileTypeToUploadType(string(upload.UploadType)),
		Status:       convertUploadStatus(string(upload.Status)),
		FileHash:     upload.FileHash,
		CreatedAt:    timestamppb.New(upload.CreatedAt),
		UpdatedAt:    timestamppb.New(upload.UpdatedAt),
	}

	// Handle nullable fields
	if upload.ProcessedAt != nil {
		pbUpload.ProcessedAt = timestamppb.New(*upload.ProcessedAt)
	}
	if upload.ThumbnailURL != "" {
		pbUpload.ThumbnailUrl = upload.ThumbnailURL
	}
	if upload.ExtractedText != "" {
		pbUpload.ExtractedText = upload.ExtractedText
	}
	if upload.ProcessingLogs != "" {
		pbUpload.ProcessingLogs = upload.ProcessingLogs
	}
	if upload.ErrorMessage != "" {
		pbUpload.ErrorMessage = upload.ErrorMessage
	}

	return pbUpload
}

// Convert file type to upload type
func convertFileTypeToUploadType(fileType string) pb.UploadType {
	switch fileType {
	case "FUEL_RECEIPT":
		return pb.UploadType_UPLOAD_TYPE_FUEL_RECEIPT
	case "POD":
		return pb.UploadType_UPLOAD_TYPE_POD
	case "SIGNATURE":
		return pb.UploadType_UPLOAD_TYPE_SIGNATURE
	case "VEHICLE_PHOTO":
		return pb.UploadType_UPLOAD_TYPE_VEHICLE_PHOTO
	case "DRIVER_DOCUMENT":
		return pb.UploadType_UPLOAD_TYPE_DRIVER_DOCUMENT
	case "COMPLIANCE":
		return pb.UploadType_UPLOAD_TYPE_COMPLIANCE
	case "INCIDENT":
		return pb.UploadType_UPLOAD_TYPE_INCIDENT
	default:
		return pb.UploadType_UPLOAD_TYPE_OTHER
	}
}

// Convert upload status
func convertUploadStatus(status string) pb.UploadStatus {
	switch status {
	case "PENDING":
		return pb.UploadStatus_UPLOAD_STATUS_PENDING
	case "UPLOADING":
		return pb.UploadStatus_UPLOAD_STATUS_PROCESSING
	case "PROCESSED":
		return pb.UploadStatus_UPLOAD_STATUS_PROCESSED
	case "FAILED":
		return pb.UploadStatus_UPLOAD_STATUS_FAILED
	case "REJECTED":
		return pb.UploadStatus_UPLOAD_STATUS_REJECTED
	default:
		return pb.UploadStatus_UPLOAD_STATUS_PENDING
	}
}

// Get MIME type from filename
func getMimeType(filename string) string {
	switch {
	case fmt.Sprintf("%s", filename)[len(filename)-4:] == ".pdf":
		return "application/pdf"
	case fmt.Sprintf("%s", filename)[len(filename)-4:] == ".jpg" || fmt.Sprintf("%s", filename)[len(filename)-5:] == ".jpeg":
		return "image/jpeg"
	case fmt.Sprintf("%s", filename)[len(filename)-4:] == ".png":
		return "image/png"
	case fmt.Sprintf("%s", filename)[len(filename)-4:] == ".gif":
		return "image/gif"
	default:
		return "application/octet-stream"
	}
}
