# 🚛 FleetFlow India - MVP Development Requirements

## 📋 **Executive Summary**

This document outlines the comprehensive requirements to complete the FleetFlow India MVP. While the **web dashboard UI is 100% complete** and matches design specifications, significant work remains in backend security, mobile app development, real-time features, and analytics.

### **Current Status Overview**
- ✅ **Web UI/UX**: 100% Complete (Design specifications implemented)
- 🟡 **Backend APIs**: 70% Complete
- 🔴 **Mobile App**: 15% Complete  
- 🟡 **Authentication**: 40% Complete
- 🟡 **Real-time Features**: 30% Complete
- 🔴 **Analytics/BI**: 10% Complete
- 🔴 **Testing**: 5% Complete

---

## 🎯 **Development Priorities**

### **P0 - Critical (Must Complete for MVP)**
1. Authentication & Security System
2. Mobile App Core Features
3. Fuel Theft Detection v1
4. Real-time WebSocket Integration

### **P1 - High (MVP+)**
1. Advanced Analytics Dashboard
2. Compliance Management System
3. External Integrations (Twilio, AWS)

### **P2 - Medium (Post-MVP)**
1. Internationalization (Hindi/English)
2. Advanced Reporting
3. Performance Optimization

---

## 🔐 **1. AUTHENTICATION & SECURITY SYSTEM**

### **Current State**
- Basic JWT authentication exists
- OTP system implemented but not linked to drivers
- Role-based access partially implemented

### **Requirements**

#### **1.1 Refresh Token System**
**Priority**: P0  
**Effort**: 3 days  
**Dependencies**: JWT Service cleanup

**Acceptance Criteria**:
- [ ] Implement refresh token generation and storage
- [ ] Auto-refresh on token expiry (web/mobile)
- [ ] Secure logout with token invalidation
- [ ] Token rotation on each refresh

**Technical Specifications**:
```java
// Backend
@Entity
public class RefreshToken {
    private String token;
    private Long userId;
    private Instant expiryDate;
    private boolean revoked;
}

// API Endpoints
POST /api/auth/refresh
POST /api/auth/logout
```

#### **1.2 Role-Based Access Control (RBAC)**
**Priority**: P0  
**Effort**: 4 days  
**Dependencies**: User-Driver linking

**Acceptance Criteria**:
- [ ] Define ADMIN and DRIVER roles with permissions
- [ ] Implement @PreAuthorize annotations on endpoints
- [ ] Role-based UI component rendering
- [ ] Audit logging for permission checks

**Technical Specifications**:
```java
// Roles and Permissions
public enum Role {
    ADMIN("fleet:read", "fleet:write", "reports:read"),
    DRIVER("trips:read", "trips:write", "fuel:write")
}

// Security Configuration
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/api/admin/reports")
```

#### **1.3 OTP-Driver Entity Linking**
**Priority**: P0  
**Effort**: 2 days  
**Dependencies**: Driver entity structure

**Acceptance Criteria**:
- [ ] Link UserAccount to Driver entity via phone number
- [ ] Driver profile completion after OTP verification
- [ ] Permission inheritance from driver role
- [ ] Driver-specific data access restrictions

**Technical Specifications**:
```java
@Entity
public class UserAccount {
    private String phone;
    private Role role;
    @OneToOne
    private Driver driver; // Link to driver entity
}
```

#### **1.4 Security Hardening**
**Priority**: P1  
**Effort**: 2 days

**Acceptance Criteria**:
- [ ] CORS configuration for production
- [ ] CSP headers implementation
- [ ] File upload validation (type, size, content)
- [ ] Rate limiting on authentication endpoints
- [ ] Input sanitization and validation

---

## 📱 **2. MOBILE APP DEVELOPMENT**

### **Current State**
- Basic Expo React Native structure
- No authentication flows
- No real functionality implemented

### **Requirements**

#### **2.1 Authentication Flows**
**Priority**: P0  
**Effort**: 5 days  
**Dependencies**: Backend OTP-Driver linking

**Acceptance Criteria**:
- [ ] Phone number input with country code (+91)
- [ ] OTP request and verification
- [ ] Persistent login with refresh tokens
- [ ] Logout functionality
- [ ] Driver profile display

**Technical Specifications**:
```typescript
// Screen Structure
- LoginScreen (phone input)
- OTPVerificationScreen
- DashboardScreen (post-auth)
- ProfileScreen

// State Management
const useAuth = () => {
  const [user, setUser] = useState();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
}
```

#### **2.2 Background GPS Tracking**
**Priority**: P0  
**Effort**: 6 days  
**Dependencies**: Location permissions, WebSocket setup

**Acceptance Criteria**:
- [ ] Continuous background location tracking
- [ ] Configurable ping intervals (30s to 5min)
- [ ] Offline location queue with sync
- [ ] Battery optimization settings
- [ ] Network-aware tracking (2G/3G/4G)

**Technical Specifications**:
```typescript
// Location Service
const LocationService = {
  startTracking: (driverId: string, tripId?: string) => void,
  stopTracking: () => void,
  setTrackingInterval: (seconds: number) => void,
  syncOfflineLocations: () => Promise<void>
}

// Data Structure
interface LocationPing {
  driverId: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}
```

#### **2.3 Trip Management**
**Priority**: P0  
**Effort**: 8 days  
**Dependencies**: Backend trip lifecycle APIs

**Acceptance Criteria**:
- [ ] Trip list view (assigned/active/completed)
- [ ] Trip detail view with route map
- [ ] Start/pause/resume/complete trip actions
- [ ] Real-time trip status updates via WebSocket
- [ ] Trip progress tracking with ETA

**Technical Specifications**:
```typescript
// Trip Screens
- TripListScreen
- TripDetailScreen  
- TripMapScreen
- TripActionsSheet

// Trip States
enum TripStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

#### **2.4 Fuel Receipt Capture**
**Priority**: P0  
**Effort**: 4 days  
**Dependencies**: Camera permissions, file upload APIs

**Acceptance Criteria**:
- [ ] Camera integration for receipt photos
- [ ] Manual fuel entry (liters, amount, odometer)
- [ ] Location auto-detection for fuel stops
- [ ] Offline fuel entry with sync
- [ ] Receipt validation and preview

**Technical Specifications**:
```typescript
// Fuel Entry Form
interface FuelEntry {
  vehicleId: string;
  liters: number;
  amountINR: number;
  odometerKm: number;
  location: string;
  receiptPhoto?: string; // base64 or file path
  timestamp: string;
}

// Camera Component
const FuelReceiptCamera = {
  captureReceipt: () => Promise<string>,
  validateImage: (imageUri: string) => boolean
}
```

#### **2.5 Proof of Delivery (POD)**
**Priority**: P0  
**Effort**: 5 days  
**Dependencies**: Signature capture, camera, file uploads

**Acceptance Criteria**:
- [ ] Digital signature capture
- [ ] Delivery photo capture
- [ ] Customer details confirmation
- [ ] POD preview and submission
- [ ] Offline POD with sync

**Technical Specifications**:
```typescript
// POD Components
const PODCapture = {
  captureSignature: () => Promise<string>,
  captureDeliveryPhoto: () => Promise<string>,
  submitPOD: (podData: PODData) => Promise<void>
}

interface PODData {
  tripId: string;
  customerSignature: string;
  deliveryPhotos: string[];
  deliveryNotes?: string;
  deliveredAt: string;
  customerName: string;
}
```

---

## ⛽ **3. FUEL THEFT DETECTION SYSTEM**

### **Current State**
- Basic fuel events stored
- No analysis or theft detection

### **Requirements**

#### **3.1 Fuel Consumption Analysis**
**Priority**: P0  
**Effort**: 5 days  
**Dependencies**: Vehicle fuel efficiency data

**Acceptance Criteria**:
- [ ] Calculate expected vs actual fuel consumption
- [ ] Route-based fuel efficiency analysis
- [ ] Vehicle-specific fuel consumption patterns
- [ ] Anomaly detection algorithms
- [ ] Configurable theft thresholds

**Technical Specifications**:
```java
@Service
public class FuelAnalysisService {
    public FuelAnalysisReport analyzeFuelConsumption(String vehicleId, LocalDate from, LocalDate to);
    public List<FuelAnomaly> detectTheftAnomalies(String vehicleId);
    public void updateFuelEfficiencyBaseline(String vehicleId);
}

// Data Structures
public class FuelAnalysisReport {
    private double expectedConsumption;
    private double actualConsumption;
    private double variance;
    private List<FuelAnomaly> anomalies;
    private FuelEfficiencyTrend trend;
}
```

#### **3.2 Geofencing for Fuel Stops**
**Priority**: P0  
**Effort**: 4 days  
**Dependencies**: GPS tracking, location services

**Acceptance Criteria**:
- [ ] Define fuel station geofences
- [ ] Detect unauthorized fuel stops
- [ ] Route deviation analysis
- [ ] Real-time alerts for off-route fueling
- [ ] Historical analysis of fuel stop patterns

**Technical Specifications**:
```java
// Geofencing Service
@Service
public class GeofencingService {
    public boolean isWithinFuelStationGeofence(Location location);
    public List<FuelStation> getNearbyFuelStations(Location location, double radiusKm);
    public void createRouteGeofence(String tripId, List<Location> routePoints);
}

// Alert Configuration
public class FuelTheftAlert {
    private String vehicleId;
    private AlertType type; // UNAUTHORIZED_STOP, EXCESS_CONSUMPTION, OFF_ROUTE_FUELING
    private double threshold;
    private boolean enabled;
}
```

#### **3.3 Real-time Theft Alerts**
**Priority**: P0  
**Effort**: 3 days  
**Dependencies**: WebSocket, notification service

**Acceptance Criteria**:
- [ ] Real-time fuel theft notifications
- [ ] Configurable alert thresholds per vehicle
- [ ] Multi-channel notifications (web, mobile, SMS)
- [ ] Alert acknowledgment and resolution tracking
- [ ] Escalation workflows

**Technical Specifications**:
```java
// Alert Service
@Service
public class FuelTheftAlertService {
    public void sendTheftAlert(FuelTheftAlert alert);
    public void acknowledgeAlert(String alertId, String userId);
    public List<FuelTheftAlert> getActiveAlerts();
}

// WebSocket Events
public enum AlertType {
    FUEL_THEFT_SUSPECTED,
    UNAUTHORIZED_FUEL_STOP,
    EXCESS_CONSUMPTION,
    GEOFENCE_VIOLATION
}
```

---

## 🌐 **4. REAL-TIME FEATURES & WEBSOCKET INTEGRATION**

### **Current State**
- Basic WebSocket setup exists
- No real-time data flow implementation

### **Requirements**

#### **4.1 Live Vehicle Tracking**
**Priority**: P0  
**Effort**: 4 days  
**Dependencies**: Mobile GPS, WebSocket infrastructure

**Acceptance Criteria**:
- [ ] Real-time vehicle position updates on web map
- [ ] Vehicle status changes (moving, stopped, offline)
- [ ] Route progress visualization
- [ ] ETA calculations and updates
- [ ] Connection status indicators

**Technical Specifications**:
```typescript
// WebSocket Events
interface VehicleLocationUpdate {
  vehicleId: string;
  driverId: string;
  tripId?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed?: number;
    heading?: number;
  };
  timestamp: string;
  status: 'moving' | 'stopped' | 'offline';
}

// Web Map Integration
const LiveMapComponent = {
  subscribeToVehicleUpdates: (vehicleIds: string[]) => void,
  updateVehiclePosition: (update: VehicleLocationUpdate) => void,
  showVehicleRoute: (tripId: string) => void
}
```

#### **4.2 Trip Status Broadcasting**
**Priority**: P0  
**Effort**: 3 days  
**Dependencies**: Trip lifecycle APIs

**Acceptance Criteria**:
- [ ] Real-time trip status updates to customers
- [ ] Driver status changes broadcast
- [ ] ETA updates based on traffic/route changes
- [ ] Delivery confirmation notifications
- [ ] Customer notification preferences

**Technical Specifications**:
```java
// WebSocket Topics
/topic/trip/{tripId}/status
/topic/vehicle/{vehicleId}/location
/topic/driver/{driverId}/status
/topic/alerts/fuel-theft
/topic/alerts/compliance

// Event Broadcasting
@EventListener
public void handleTripStatusChange(TripStatusChangeEvent event) {
    webSocketService.broadcastToTopic(
        "/topic/trip/" + event.getTripId() + "/status",
        event.getStatusUpdate()
    );
}
```

#### **4.3 Notification System**
**Priority**: P1  
**Effort**: 4 days  
**Dependencies**: External messaging providers

**Acceptance Criteria**:
- [ ] Multi-channel notifications (web, mobile, SMS, email)
- [ ] Notification preferences per user
- [ ] Real-time delivery status
- [ ] Notification history and tracking
- [ ] Template-based messaging

---

## 📊 **5. ANALYTICS & BUSINESS INTELLIGENCE**

### **Requirements**

#### **5.1 Fleet Performance Dashboard**
**Priority**: P1  
**Effort**: 6 days  
**Dependencies**: Historical data, analytics APIs

**Acceptance Criteria**:
- [ ] Revenue vs cost analysis
- [ ] Fuel efficiency trends
- [ ] Driver performance scorecards
- [ ] Vehicle utilization metrics
- [ ] Route optimization insights

**Technical Specifications**:
```java
// Analytics APIs
@RestController
public class AnalyticsController {
    @GetMapping("/api/analytics/fleet-performance")
    public FleetPerformanceReport getFleetPerformance();
    
    @GetMapping("/api/analytics/fuel-efficiency")
    public FuelEfficiencyReport getFuelEfficiency();
    
    @GetMapping("/api/analytics/driver-scorecards")
    public List<DriverScorecard> getDriverScorecards();
}
```

#### **5.2 Report Generation**
**Priority**: P1  
**Effort**: 5 days  
**Dependencies**: PDF/CSV libraries

**Acceptance Criteria**:
- [ ] PDF report generation
- [ ] CSV data exports
- [ ] Scheduled report delivery
- [ ] Custom report templates
- [ ] Report sharing and permissions

---

## 🧪 **6. TESTING & QUALITY ASSURANCE**

### **Requirements**

#### **6.1 Backend Testing**
**Priority**: P1  
**Effort**: 8 days

**Acceptance Criteria**:
- [ ] Unit tests for all service classes (80% coverage)
- [ ] Integration tests for API endpoints
- [ ] Security testing for authentication flows
- [ ] Performance testing for high-load scenarios
- [ ] Database migration testing

**Technical Specifications**:
```java
// Test Structure
src/test/java/
├── unit/
│   ├── service/
│   ├── controller/
│   └── security/
├── integration/
│   ├── api/
│   └── database/
└── performance/
    └── load/
```

#### **6.2 Frontend Testing**
**Priority**: P1  
**Effort**: 6 days

**Acceptance Criteria**:
- [ ] Component unit tests with React Testing Library
- [ ] Integration tests for user flows
- [ ] E2E tests with Playwright
- [ ] Visual regression tests
- [ ] Accessibility testing

#### **6.3 Mobile Testing**
**Priority**: P1  
**Effort**: 4 days

**Acceptance Criteria**:
- [ ] Unit tests for React Native components
- [ ] Integration tests for authentication flows
- [ ] Device testing on Android/iOS
- [ ] Offline functionality testing
- [ ] Performance testing

---

## 📋 **7. DEPLOYMENT & PRODUCTION READINESS**

### **Requirements**

#### **7.1 Environment Configuration**
**Priority**: P1  
**Effort**: 2 days

**Acceptance Criteria**:
- [ ] Production environment configuration
- [ ] Secret management setup
- [ ] Database migration scripts
- [ ] Monitoring and logging configuration
- [ ] Backup and recovery procedures

#### **7.2 Documentation**
**Priority**: P1  
**Effort**: 3 days

**Acceptance Criteria**:
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment guides
- [ ] User manuals
- [ ] Administrator guides
- [ ] Troubleshooting documentation

---

## 📅 **DEVELOPMENT TIMELINE**

### **Phase 1: Core MVP (8 weeks)**
**Weeks 1-2**: Authentication & Security
- JWT refresh token system
- Role-based access control
- OTP-Driver linking

**Weeks 3-4**: Mobile App Foundation
- Authentication flows
- Basic GPS tracking
- Trip management UI

**Weeks 5-6**: Real-time Features
- WebSocket integration
- Live vehicle tracking
- Trip status broadcasting

**Weeks 7-8**: Fuel Theft Detection
- Consumption analysis
- Geofencing
- Real-time alerts

### **Phase 2: MVP+ (4 weeks)**
**Weeks 9-10**: Advanced Features
- Analytics dashboard
- Report generation
- Compliance management

**Weeks 11-12**: Testing & Polish
- Comprehensive testing
- Performance optimization
- Documentation

---

## 🎯 **SUCCESS METRICS**

### **Technical Metrics**
- [ ] 99% uptime for core services
- [ ] <100ms API response times
- [ ] 80%+ test coverage
- [ ] Zero critical security vulnerabilities

### **Business Metrics**
- [ ] 50+ vehicles actively tracked
- [ ] 10+ fuel theft cases detected and prevented
- [ ] 95% driver adoption rate
- [ ] 90% customer satisfaction with tracking

### **Performance Metrics**
- [ ] Real-time GPS updates within 30 seconds
- [ ] Mobile app works reliably on 2G networks
- [ ] Web dashboard loads within 3 seconds
- [ ] 99.9% message delivery rate

---

## 📞 **SUPPORT & MAINTENANCE**

### **Ongoing Requirements**
- [ ] 24/7 monitoring setup
- [ ] Incident response procedures
- [ ] Regular security updates
- [ ] Database optimization
- [ ] User training programs

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Next Review**: Weekly during development

This comprehensive requirements document serves as the roadmap for completing the FleetFlow India MVP. Each section includes detailed acceptance criteria, technical specifications, and effort estimates to guide development planning and execution.
