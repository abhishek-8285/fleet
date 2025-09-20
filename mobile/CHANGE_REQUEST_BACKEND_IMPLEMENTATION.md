# Change Request System - Backend Implementation Guide

## 📋 **Backend Endpoints Needed**

Add these routes to `internal/routes/routes.go`:

```go
// Driver Change Request routes
protected.POST("/driver/change-request", driverHandler.SubmitChangeRequest)
protected.GET("/driver/change-requests", driverHandler.GetDriverChangeRequests)
protected.PUT("/driver/change-request/:id/cancel", driverHandler.CancelChangeRequest)

// Admin routes for managing change requests
admin.GET("/change-requests", adminHandler.GetAllChangeRequests)
admin.PUT("/change-request/:id/approve", adminHandler.ApproveChangeRequest)
admin.PUT("/change-request/:id/reject", adminHandler.RejectChangeRequest)
```

## 📊 **Database Model**

Add to `internal/models/`:

```go
type DriverChangeRequest struct {
    ID               uint           `json:"id" gorm:"primaryKey"`
    DriverID         uint           `json:"driver_id" gorm:"not null;index"`
    RequestType      string         `json:"request_type" gorm:"not null"` // PROFILE_UPDATE, DOCUMENT_UPDATE
    RequestedChanges datatypes.JSON `json:"requested_changes" gorm:"type:jsonb"`
    CurrentData      datatypes.JSON `json:"current_data" gorm:"type:jsonb"`
    Status           string         `json:"status" gorm:"default:'PENDING'"` // PENDING, APPROVED, REJECTED
    Priority         string         `json:"priority" gorm:"default:'NORMAL'"` // LOW, NORMAL, HIGH, URGENT
    Reason           string         `json:"reason"`
    SubmittedAt      time.Time      `json:"submitted_at" gorm:"not null"`
    ReviewedAt       *time.Time     `json:"reviewed_at,omitempty"`
    ReviewedBy       *uint          `json:"reviewed_by,omitempty" gorm:"index"`
    AdminComments    string         `json:"admin_comments"`
    CreatedAt        time.Time      `json:"created_at"`
    UpdatedAt        time.Time      `json:"updated_at"`
    DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`

    // Associations
    Driver     *Driver `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
    ReviewedByUser *User `json:"reviewed_by_user,omitempty" gorm:"foreignKey:ReviewedBy"`
}
```

## 🛠️ **Handler Implementation**

Add to `internal/handlers/handlers.go`:

```go
func (h *DriverHandler) SubmitChangeRequest(c *gin.Context) {
    var requestData struct {
        DriverID         uint           `json:"driver_id" binding:"required"`
        RequestType      string         `json:"request_type" binding:"required"`
        RequestedChanges map[string]any `json:"requested_changes" binding:"required"`
        Reason           string         `json:"reason"`
        Priority         string         `json:"priority"`
    }

    if err := c.ShouldBindJSON(&requestData); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
        return
    }

    // Get current user from JWT
    userID := c.GetUint("user_id")
    
    // Verify driver can only submit requests for themselves
    if requestData.DriverID != userID {
        c.JSON(http.StatusForbidden, gin.H{"error": "Can only submit requests for your own profile"})
        return
    }

    // Get current driver data for comparison
    var currentDriver models.Driver
    if err := h.services.DB.First(&currentDriver, userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Driver not found"})
        return
    }

    changeRequest := models.DriverChangeRequest{
        DriverID:         requestData.DriverID,
        RequestType:      requestData.RequestType,
        RequestedChanges: requestData.RequestedChanges,
        CurrentData:      currentDriver, // Store current state
        Status:           "PENDING",
        Priority:         requestData.Priority,
        Reason:           requestData.Reason,
        SubmittedAt:      time.Now(),
    }

    if err := h.services.DB.Create(&changeRequest).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create change request"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "message": "Change request submitted successfully",
        "request_id": changeRequest.ID,
        "status": "PENDING"
    })
}
```

## 📱 **Mobile App Benefits**

With this system:
- ✅ **No 404 errors** - proper endpoint exists
- ✅ **Admin approval workflow** - maintains data integrity  
- ✅ **Change tracking** - audit trail of all changes
- ✅ **User feedback** - drivers can see request status
- ✅ **Graceful UX** - clear messaging about approval process

## 🎯 **Current Mobile App Status**

The mobile app now:
- ✅ **Submits change requests** instead of direct updates
- ✅ **Shows change request screen** to track status
- ✅ **Handles API gracefully** (fallback when endpoints not ready)
- ✅ **Provides clear user feedback**
