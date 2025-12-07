package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// VideoHandler handles video-related requests
type VideoHandler struct {
	videoService *services.VideoService
}

// NewVideoHandler creates a new video handler
func NewVideoHandler(videoService *services.VideoService) *VideoHandler {
	return &VideoHandler{
		videoService: videoService,
	}
}

// RegisterCamera adds a new camera
// @Summary Register Camera
// @Tags video
// @Accept json
// @Produce json
// @Param camera body models.Camera true "Camera"
// @Success 201 {object} models.Camera
// @Router /video/cameras [post]
func (h *VideoHandler) RegisterCamera(c *gin.Context) {
	var camera models.Camera
	if err := c.ShouldBindJSON(&camera); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.videoService.RegisterCamera(&camera); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, camera)
}

// ProcessAIEvent handles AI detection events from cameras
// @Summary Process AI Event
// @Tags video
// @Accept json
// @Produce json
// @Param event body struct{Serial string; Type string; Timestamp time.Time; Detections []models.AIDetection} true "Event"
// @Success 200 {object} map[string]string
// @Router /video/events [post]
func (h *VideoHandler) ProcessAIEvent(c *gin.Context) {
	var req struct {
		Serial     string                `json:"serial"`
		Type       models.VideoEventType `json:"type"`
		Timestamp  time.Time             `json:"timestamp"`
		Detections []models.AIDetection  `json:"detections"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.videoService.ProcessAIEvent(req.Serial, req.Type, req.Timestamp, req.Detections); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "processed"})
}

// GetClips returns video clips
// @Summary Get Video Clips
// @Tags video
// @Produce json
// @Param vehicle_id query int false "Vehicle ID"
// @Param type query string false "Event Type"
// @Success 200 {array} models.VideoClip
// @Router /video/clips [get]
func (h *VideoHandler) GetClips(c *gin.Context) {
	vehicleID, _ := strconv.ParseUint(c.Query("vehicle_id"), 10, 32)
	eventType := c.Query("type")

	clips, err := h.videoService.GetClips(uint(vehicleID), eventType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, clips)
}
