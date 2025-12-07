# 📱 FleetFlow Driver App: Premium Design Specification

**Goal**: Create a "Samsara-class" mobile experience for drivers. The app must be **industrial, high-contrast, and safety-focused**. It is not just a tracking app; it is a professional tool for the driver's daily workflow.

## 1. Design Philosophy: "Industrial Elegance"
*   **Visual Language**: Big buttons, clear typography, high contrast.
*   **Theme**: Dark Mode First (Drivers work at night).
*   **Color Palette**:
    *   **Primary**: Deep Navy Blue (`#0A1929`) - Professional, Trust.
    *   **Accent**: Electric Blue (`#2196F3`) - Actionable items.
    *   **Safety**: Signal Red (`#D32F2F`) - Critical alerts.
    *   **Success**: Emerald Green (`#2E7D32`) - Compliance/Good status.
    *   **Surface**: Dark Grey (`#121212`) - Backgrounds.

## 2. Core Navigation (Bottom Tab Bar)
1.  **Home (Dashboard)**: "My Day" view.
2.  **HOS (Compliance)**: ELD/Duty Status.
3.  **Documents**: Digital Wallet.
4.  **Safety**: Driver Scorecard.
5.  **More**: Settings, Vehicle Inspection (DVIR).

---

## 3. Screen Specifications

### 🏠 3.1 Home Screen ("My Day")
**Purpose**: Instant situational awareness.
*   **Header**: "Good Morning, Rajesh" + Weather Icon + Vehicle ID (`KA-01-HH-1234`).
*   **Hero Section**: **Duty Status Circle**.
    *   A large, animated ring showing "Remaining Drive Time" (e.g., 4h 12m).
    *   Center text: "ON DUTY".
    *   Tap to change status (OFF, SB, D, ON).
*   **Quick Actions (Grid)**:
    *   [Start Trip] (Green, prominent).
    *   [DVIR] (Inspection).
    *   [Fuel] (Log fill-up).
    *   [Inbox] (Dispatcher messages).
*   **Recent Activity**: "Trip #1023 completed - 45km".

### ⏱️ 3.2 HOS (Hours of Service)
**Purpose**: Regulatory compliance (FMCSA/AIS-140).
*   **The Grid**: A horizontal 24h graph showing duty status changes.
*   **Clocks**: 4 countdown timers (Break, Drive, Shift, Cycle).
*   **Action**: "Certify Logs" button (Signature pad popup).
*   **Visuals**: Use Red/Green indicators for violations.

### 📄 3.3 Documents (Digital Wallet)
**Purpose**: Eliminate paper.
*   **Layout**: Card stack interface (Apple Wallet style).
*   **Items**:
    *   Driving License (Front/Back).
    *   Vehicle Registration (RC).
    *   Insurance Certificate.
    *   Permits (State/National).
*   **Action**: "Share" button to generate a QR code for police inspection.

### 🛡️ 3.4 Safety Scorecard
**Purpose**: Gamification and coaching.
*   **Hero Score**: Large number "85" (Green).
*   **Trend**: "⬆️ 2 pts since last week".
*   **Events List**:
    *   "Harsh Braking" - Yesterday - 10:45 AM (Map snapshot).
    *   "Speeding" - Today - 02:15 PM (>85 km/h).
*   **Coaching**: "Video Tip: Maintaining safe following distance".

### 🚛 3.5 DVIR (Vehicle Inspection)
**Purpose**: Safety checks.
*   **Flow**: Step-by-step wizard.
*   **Visuals**: 3D/2D outline of the truck. Tap a part (Tires, Lights, Brakes) to mark defect.
*   **Evidence**: "Take Photo" button for defects.
*   **Sign-off**: Digital signature pad.

---

## 4. UI Components (React Native Paper / NativeBase)
*   **Buttons**: Full width, 56px height (easy to tap with gloves).
*   **Cards**: Elevated, rounded corners (12px), subtle shadow.
*   **Typography**:
    *   Headings: `Roboto` / `Inter` (Bold, 24sp).
    *   Body: `Roboto` (Regular, 16sp).
*   **Animations**: Smooth transitions between tabs; "Fill" animation for fuel/time rings.

## 5. Technical Constraints
*   **Offline First**: App must work 100% without internet (sync later).
*   **Battery Optimized**: Dark mode saves OLED screens.
*   **Location**: Background GPS service must be robust.
