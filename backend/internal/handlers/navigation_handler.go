package handlers

import (
	"net/http"
	"strconv"

	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// NavigationHandler handles navigation-related requests
type NavigationHandler struct {
	navService *services.NavigationService
}

// NewNavigationHandler creates a new navigation handler
func NewNavigationHandler(navService *services.NavigationService) *NavigationHandler {
	return &NavigationHandler{
		navService: navService,
	}
}

// SimulateDeadReckoning calculates a projected position
// @Summary Simulate Dead Reckoning
// @Description Calculate projected position based on last known state
// @Tags navigation
// @Produce json
// @Param lat query number true "Last Latitude"
// @Param lon query number true "Last Longitude"
// @Param speed query number true "Speed (km/h)"
// @Param heading query number true "Heading (degrees)"
// @Param time_delta query number true "Time Delta (seconds)"
// @Success 200 {object} map[string]float64
// @Router /navigation/dead-reckoning [get]
func (h *NavigationHandler) SimulateDeadReckoning(c *gin.Context) {
	lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
	lon, _ := strconv.ParseFloat(c.Query("lon"), 64)
	speed, _ := strconv.ParseFloat(c.Query("speed"), 64)
	heading, _ := strconv.ParseFloat(c.Query("heading"), 64)
	delta, _ := strconv.ParseFloat(c.Query("time_delta"), 64)

	newLat, newLon := h.navService.CalculateDeadReckoning(lat, lon, speed, heading, delta)

	c.JSON(http.StatusOK, gin.H{
		"projected_lat": newLat,
		"projected_lon": newLon,
	})
}

// SnapToRoad snaps a point to the nearest road
// @Summary Snap to Road
// @Description Snap raw GPS coordinates to the nearest road segment
// @Tags navigation
// @Produce json
// @Param lat query number true "Latitude"
// @Param lon query number true "Longitude"
// @Success 200 {object} map[string]float64
// @Router /navigation/snap [get]
func (h *NavigationHandler) SnapToRoad(c *gin.Context) {
	lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
	lon, _ := strconv.ParseFloat(c.Query("lon"), 64)

	snappedLat, snappedLon, err := h.navService.SnapToRoad(c.Request.Context(), lat, lon)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"original_lat": lat,
		"original_lon": lon,
		"snapped_lat":  snappedLat,
		"snapped_lon":  snappedLon,
	})
}

// GetDirections fetches turn-by-turn directions
// @Summary Get Directions
// @Description Get turn-by-turn directions between two points
// @Tags navigation
// @Produce json
// @Param origin query string true "Origin Address or Lat,Lon"
// @Param destination query string true "Destination Address or Lat,Lon"
// @Success 200 {object} map[string][]string
// @Router /navigation/directions [get]
func (h *NavigationHandler) GetDirections(c *gin.Context) {
	origin := c.Query("origin")
	dest := c.Query("destination")

	steps, err := h.navService.GetTurnByTurnDirections(c.Request.Context(), origin, dest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"steps": steps,
	})
}
