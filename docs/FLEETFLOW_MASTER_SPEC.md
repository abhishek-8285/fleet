# 🚛 FleetFlow Master Specification

**Version**: 2.0 (Consolidated)
**Status**: Active Development
**Type**: Master Product Bible

---

## 1. Executive Summary
FleetFlow is being built as a **"Samsara-class" Connected Operations Platform** for the Indian market. It combines advanced telematics, video AI, and regulatory compliance (AIS-140, ELD) into a single enterprise-grade solution.

### Current Status (Dec 2025)
*   **Architecture**: Enterprise Monorepo (Go Backend + React Frontend + Mobile).
*   **Core Services**: ✅ Auth, Organization, Vehicle, Driver, Asset, Video (Metadata).
*   **Frontend**: ✅ Web Dashboard (100% UI), Mobile App (15%).
*   **Gap**: Hardware Data Ingestion (Simulation required).

---

## 2. System Architecture

### 2.1 Monorepo Structure
```
fleet/
├── 📂 backend/              # Go gRPC Services (Clean Architecture)
│   ├── cmd/                 # Entry points (API Gateway, gRPC Server)
│   ├── internal/            # Business Logic (Services, Models)
│   └── proto/               # Protocol Buffers Definitions
├── 📂 frontend/             # Web Applications
│   ├── dashboard/           # React Admin Dashboard (Vite + MUI)
│   └── portal/              # Next.js Customer Portal
├── 📱 mobile/               # React Native Driver App (Expo)
└── 📂 docs/                 # Centralized Documentation
```

### 2.2 Technology Stack
*   **Backend**: Go 1.23, gRPC, PostgreSQL, Redis, MQTT.
*   **Frontend**: React, TypeScript, Material UI, Tailwind CSS.
*   **Mobile**: React Native, Expo.
*   **Infra**: Docker Compose, Kubernetes (Planned).

---

## 3. Feature Specification

### 3.1 Core Modules (Implemented)
| Module | Status | Description |
|--------|--------|-------------|
| **Authentication** | ✅ | JWT, Refresh Tokens, RBAC (Admin/Driver). |
| **Organization** | ✅ | Multi-tenant support, User management. |
| **Vehicle/Driver** | ✅ | CRUD operations, Assignment logic. |
| **Asset Tracking** | ✅ | BLE Beacon support, Yard management (Geofencing). |
| **Video AI** | ⚠️ | Metadata & Event logic ready; Video processing mocked. |

### 3.2 In Progress
*   **Hardware Simulator**: A Go service to simulate OBD-II, GPS, and Video events to feed the system.
*   **Mobile App**: Driver authentication and basic GPS tracking.

### 3.3 Planned (Roadmap)
*   **Fuel Theft Detection**: Consumption analysis and anomaly detection.
*   **ELD Compliance**: FMCSA/AIS-140 Hours of Service logging.
*   **Advanced Analytics**: Fleet utilization and safety scoring.

---

## 4. Technical Reference

### 4.1 API Standards
*   **Internal**: gRPC for inter-service communication.
*   **External**: REST API Gateway (exposed via Gin).
*   **Auth**: Bearer Token (JWT) required for all protected endpoints.

### 4.2 Key Data Models
*   **User**: `id`, `phone`, `role`, `org_id`.
*   **Vehicle**: `id`, `vin`, `plate`, `status` (Active/Maintenance).
*   **Trip**: `id`, `vehicle_id`, `driver_id`, `route`, `status` (Scheduled/Active/Completed).

---

## 5. Execution Roadmap

### Phase 1: Foundation & Recovery (Current)
*   [x] Restructure Project (Monorepo).
*   [x] Cleanup Legacy Code.
*   [ ] **Build Hardware Simulator** (Critical for demo).
*   [ ] Verify Video & Asset Services with simulated data.

### Phase 2: Enterprise Core
*   [ ] **Deep Telemetry**: OBD-II/CAN bus integration.
*   [ ] **Video AI**: Integrate real object detection pipeline.
*   [ ] **Safety Scoring**: Driver behavior analysis.

### Phase 3: Compliance & Scale
*   [ ] **ELD/HOS**: Regulatory compliance engine.
*   [ ] **Billing**: Usage-based subscription model.
*   [ ] **Developer API**: Public API gateway.

---

## 6. Development Guidelines
*   **Quality Over Speed**: Build it right the first time.
*   **Security First**: Rotate secrets, validate inputs, use RBAC.
*   **Test Driven**: Write tests for all new services.
