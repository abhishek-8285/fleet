package handlers

import (
	"net/http"
	"strconv"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// AssetHandler handles asset-related requests
type AssetHandler struct {
	assetService *services.AssetService
}

// NewAssetHandler creates a new asset handler
func NewAssetHandler(assetService *services.AssetService) *AssetHandler {
	return &AssetHandler{
		assetService: assetService,
	}
}

// CreateAsset adds a new asset
// @Summary Create Asset
// @Tags assets
// @Accept json
// @Produce json
// @Param asset body models.Asset true "Asset"
// @Success 201 {object} models.Asset
// @Router /assets [post]
func (h *AssetHandler) CreateAsset(c *gin.Context) {
	var asset models.Asset
	if err := c.ShouldBindJSON(&asset); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.assetService.CreateAsset(&asset); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, asset)
}

// CreateYard adds a new yard
// @Summary Create Yard
// @Tags assets
// @Accept json
// @Produce json
// @Param yard body models.Yard true "Yard"
// @Success 201 {object} models.Yard
// @Router /yards [post]
func (h *AssetHandler) CreateYard(c *gin.Context) {
	var yard models.Yard
	if err := c.ShouldBindJSON(&yard); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.assetService.CreateYard(&yard); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, yard)
}

// SimulateBeaconPing simulates a beacon ping
// @Summary Simulate Beacon Ping
// @Tags assets
// @Accept json
// @Produce json
// @Param beacon_id query string true "Beacon ID"
// @Param lat query number true "Latitude"
// @Param lon query number true "Longitude"
// @Success 200 {object} map[string]string
// @Router /assets/ping [post]
func (h *AssetHandler) SimulateBeaconPing(c *gin.Context) {
	beaconID := c.Query("beacon_id")
	lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
	lon, _ := strconv.ParseFloat(c.Query("lon"), 64)

	if err := h.assetService.ProcessBeaconPing(beaconID, lat, lon); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "processed"})
}

// UpdateInventory updates item quantity
// @Summary Update Inventory
// @Tags inventory
// @Accept json
// @Produce json
// @Param id path int true "Item ID"
// @Param change query int true "Quantity Change (+/-)"
// @Success 200 {object} map[string]string
// @Router /inventory/{id}/update [post]
func (h *AssetHandler) UpdateInventory(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	change, _ := strconv.Atoi(c.Query("change"))

	if err := h.assetService.UpdateInventory(uint(id), change); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

// GetLowStock returns low stock items
// @Summary Get Low Stock
// @Tags inventory
// @Produce json
// @Success 200 {array} models.InventoryItem
// @Router /inventory/low-stock [get]
func (h *AssetHandler) GetLowStock(c *gin.Context) {
	items, err := h.assetService.GetInventoryLowStock()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}
