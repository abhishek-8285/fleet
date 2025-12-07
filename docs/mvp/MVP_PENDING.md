# FleetFlow India – Pending Work for MVP (No Docker)

This tracks remaining work to reach the MVP, excluding Docker/deploy.

## Test creds and dev setup
- Admin (web): username `admin`, password `admin123`
- Driver OTP (dev): send POST /api/otp/send { phone } → testOtp 1111; verify with POST /api/otp/verify { phone, code: 1111 }
- Simulator: Spring Boot service on port 9090 for SMS/WhatsApp/Storage
- Web dev: use Node 20 via nvm; set VITE_GOOGLE_MAPS_API_KEY in web/.env

## Backend
- Auth & security
  - Refresh tokens; logout
  - Per-endpoint roles (ADMIN/DRIVER)
  - Link OTP users to Driver entities; enforce permissions
  - Unify JWT signing/verification (JwtService vs JwtAuthFilter)
- API quality
  - DTOs for requests/responses; Bean Validation
  - Global error handler + error contract
  - Pagination/sort/filter for list endpoints
- Fuel-theft (Phase 1)
  - Mileage vs fuel heuristics (vehicle/trip)
  - Unscheduled stops/geofences; thresholds
  - Alerts API + daily/weekly reports
- Trips lifecycle
  - assign/start/pause/resume/complete endpoints
  - POD uploads linked to trips; metadata
  - Presigned URLs (non-dev) and file validation
- Compliance
  - AIS-140 fields + status per vehicle
  - DL/RC/insurance expiry reminders; report endpoints (CSV/PDF)
- Providers (non-dev)
  - Twilio SMS/WhatsApp adapter (replace placeholder)
  - AWS S3 storage adapter (replace placeholder)
- Observability
  - Audit logs, metrics, rate limiting

## Simulator (9090)
- Prefer HTTP simulator in dev; remove in-process simulators
- Add mocks: route polylines + ETA/distance matrix; fuel station lookup
- Scenario presets (normal/anomaly) for theft/compliance tests

## Web (React + Vite + MUI)
- Dev ergonomics
  - Commit .nvmrc (Node 20); README note for nvm
  - Token expiry handling; redirect to /login on 401
- UI/UX
  - Tables with filters/sort/pagination for Vehicles/Drivers/Trips/Fuel
  - Create/edit/detail forms with validation and toasts
  - Public tracking page UI (status, ETA, last location, POD preview)
  - Google Maps live view with WS updates
  - i18n scaffolding (Hindi/English) and RTL readiness

## Mobile (Expo RN)
- Auth & localization
  - OTP login flows (hi/en); persisted auth & refresh
- GPS & offline
  - Background location reporting; offline queue + sync
  - Battery/network-aware intervals; 2G/SMS fallbacks
- Trip & fuel
  - Trip list/detail; start/pause/resume/complete
  - Fuel receipt capture (camera) + liters/amount/odometer; upload to /api/uploads/fuel-receipt
  - POD capture (signature/photos) → /api/uploads/pod
  - Realtime assignment via WebSocket

## Data & BI
- Dashboards: theft savings, route efficiency, driver scorecards, revenue vs cost
- CSV exports + scheduled email summaries

## Compliance
- Vehicle compliance score; reminders + escalations
- Report generation endpoints (CSV/PDF)

## QA & Testing
- Unit/integration tests (backend/web/mobile)
- E2E happy path (login → create trip → track → POD)
- Postman collection + seed data

## Security & Privacy
- Tighten CORS/CSP; file type/size validation
- PII handling, retention, basic DPDP compliance

## Environment & config (no Docker)
- Update .env.example for backend/web/mobile
- Clear run instructions: simulator 9090, backend 8080, web 5173/5174

## Immediate next steps
1. Commit .nvmrc; unify JWT; remove in-process simulators
2. Add DTOs/validation, global error handling; pagination on lists
3. Implement Google Maps live WS view on web
4. Mobile: OTP login + background GPS prototype with offline queue
5. Fuel-theft heuristics v1 + alert endpoints
