# 🚛 FleetFlow Go Backend

A high-performance, scalable backend for FleetFlow India's fleet management system built with Go, Gin, and GORM.

## 🚀 **Quick Start**

### **Prerequisites**
- Go 1.21 or higher
- PostgreSQL 14+
- Redis (optional, for caching)

### **Installation**

1. **Clone and setup:**
```bash
cd go-backend
go mod download
```

2. **Database setup:**
```bash
# Create PostgreSQL database
createdb fleetflow

# Copy environment configuration
cp .env.example .env
# Edit .env with your database credentials
```

3. **Run the server:**
```bash
go run main.go
```

Server will start on `http://localhost:8080`

## 📋 **Environment Variables**

Copy `.env.example` to `.env` and configure:

```bash
# Core settings
PORT=8080
ENVIRONMENT=development
DATABASE_URL=postgres://user:password@localhost/fleetflow?sslmode=disable
JWT_SECRET=your-secret-key

# External services (optional for development)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
AWS_ACCESS_KEY=your-aws-key
AWS_SECRET_KEY=your-aws-secret
GOOGLE_MAPS_API_KEY=your-maps-key
```

## 🏗️ **Architecture**

### **Project Structure**
```
go-backend/
├── main.go                 # Application entry point
├── internal/
│   ├── config/            # Configuration management
│   ├── database/          # Database connection and migrations
│   ├── models/            # Domain models and database entities
│   ├── services/          # Business logic layer
│   ├── handlers/          # HTTP request handlers
│   ├── middleware/        # HTTP middleware (auth, CORS, etc.)
│   └── routes/            # API route definitions
├── go.mod                 # Go module definition
└── README.md
```

### **Technology Stack**
- **Framework:** Gin (HTTP router)
- **Database:** GORM + PostgreSQL
- **Authentication:** JWT with refresh tokens
- **Real-time:** WebSockets
- **Documentation:** Swagger/OpenAPI
- **Testing:** Built-in Go testing + Testify

## 📚 **API Documentation**

### **Authentication Endpoints**
```
POST /api/v1/auth/otp/send     - Send OTP to phone
POST /api/v1/auth/otp/verify   - Verify OTP and login
POST /api/v1/auth/refresh      - Refresh access token
POST /api/v1/auth/logout       - Logout user
```

### **Core Resources**
```
# Drivers
GET    /api/v1/drivers         - List drivers
POST   /api/v1/drivers         - Create driver
GET    /api/v1/drivers/:id     - Get driver details
PUT    /api/v1/drivers/:id     - Update driver
DELETE /api/v1/drivers/:id     - Delete driver

# Vehicles
GET    /api/v1/vehicles        - List vehicles  
POST   /api/v1/vehicles        - Create vehicle
GET    /api/v1/vehicles/:id    - Get vehicle details
PUT    /api/v1/vehicles/:id    - Update vehicle
DELETE /api/v1/vehicles/:id    - Delete vehicle

# Trips
GET    /api/v1/trips           - List trips
POST   /api/v1/trips           - Create trip
GET    /api/v1/trips/:id       - Get trip details
POST   /api/v1/trips/:id/start - Start trip
POST   /api/v1/trips/:id/complete - Complete trip

# Fuel Management
GET    /api/v1/fuel/events     - List fuel events
POST   /api/v1/fuel/events     - Record fuel purchase
GET    /api/v1/fuel/alerts     - Get fuel theft alerts
GET    /api/v1/fuel/analytics  - Fuel consumption analytics
```

### **Real-time Features**
```
GET    /api/v1/ws              - WebSocket connection for live updates
POST   /api/v1/location/ping   - Record GPS location
```

### **Public Endpoints**
```
GET    /api/v1/tracking/:id    - Public trip tracking (for customers)
GET    /health                 - Health check
```

## 🔐 **Authentication & Authorization**

### **OTP-based Authentication**
1. Send OTP to phone number
2. Verify OTP to get JWT access token + refresh token
3. Use access token for API calls
4. Refresh token when expired

### **Role-based Access Control**
- **ADMIN:** Full access to all resources
- **DRIVER:** Limited access to assigned trips and fuel logging

### **JWT Token Structure**
```json
{
  "user_id": 123,
  "phone": "+919876543210",
  "role": "DRIVER",
  "driver_id": 456,
  "exp": 1640995200
}
```

## 📊 **Database Models**

### **Core Entities**
- **UserAccount:** Authentication and user management
- **Driver:** Driver profiles and performance metrics
- **Vehicle:** Fleet vehicles and compliance status
- **Trip:** Trip lifecycle and tracking
- **LocationPing:** GPS tracking data
- **FuelEvent:** Fuel purchases and consumption
- **FuelAlert:** Theft detection and alerts

### **Database Migrations**
GORM AutoMigrate handles schema creation automatically on startup.

## 🛡️ **Security Features**

### **Built-in Security**
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Request rate limiting
- CORS protection
- SQL injection protection (GORM)
- XSS protection headers
- Input validation and sanitization

### **Audit Logging**
All actions are logged with:
- User identification
- Action type and timestamp
- IP address and user agent
- Before/after values for data changes

## 📈 **Performance Features**

### **Optimizations**
- Connection pooling (database)
- Concurrent GPS processing (goroutines)
- Efficient JSON serialization
- Database query optimization
- Caching layer (Redis)

### **Monitoring**
- Health check endpoints
- Performance metrics
- Error logging and tracking
- Database connection monitoring

## 🔄 **Real-time Features**

### **WebSocket Integration**
- Live vehicle tracking
- Real-time trip updates
- Instant fuel theft alerts
- Driver status updates

### **GPS Tracking**
- High-frequency location updates
- Geofencing capabilities
- Route deviation detection
- Fuel stop monitoring

## 🧪 **Testing**

### **Run Tests**
```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific package tests
go test ./internal/services/...
```

### **Test Categories**
- Unit tests for business logic
- Integration tests for API endpoints
- Database tests with test database
- WebSocket connection tests

## 🚀 **Deployment**

### **Development**
```bash
go run main.go
```

### **Production Build**
```bash
# Build binary
go build -o fleetflow-api main.go

# Run production binary
./fleetflow-api
```

### **Docker Deployment**
```bash
# Build image
docker build -t fleetflow-api .

# Run container
docker run -p 8080:8080 fleetflow-api
```

## 📋 **Development Workflow**

### **Adding New Features**
1. Create model in `internal/models/`
2. Add business logic in `internal/services/`
3. Create HTTP handlers in `internal/handlers/`
4. Register routes in `internal/routes/`
5. Add tests and documentation

### **Code Standards**
- Use `gofmt` for formatting
- Follow Go naming conventions
- Add comments for exported functions
- Use dependency injection pattern
- Implement proper error handling

## 🐛 **Troubleshooting**

### **Common Issues**

**Database Connection Failed:**
```bash
# Check PostgreSQL is running
pg_ctl status

# Verify connection string in .env
DATABASE_URL=postgres://user:password@localhost/fleetflow?sslmode=disable
```

**JWT Token Invalid:**
```bash
# Check JWT_SECRET in .env matches across all instances
# Tokens expire after 24 hours by default
```

**CORS Errors:**
```bash
# Add your frontend URL to CORS_ALLOWED_ORIGINS in .env
```

### **Logs and Debugging**
```bash
# Enable debug logging
ENVIRONMENT=development go run main.go

# Database query logging is enabled in development mode
```

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 **Support**

- **Documentation:** Check API docs at `/swagger/index.html`
- **Issues:** Create GitHub issues for bugs
- **Questions:** Use GitHub discussions

---

**Built with ❤️ for FleetFlow India** 🇮🇳
