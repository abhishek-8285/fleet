# FleetFlow Driver App

A premium, industrial-grade mobile application for fleet drivers, built with **Flutter**.

## 📱 Features
*   **Home Dashboard**: Real-time duty status, weather, and quick actions.
*   **HOS (Hours of Service)**: Interactive graphs and compliance timers.
*   **Digital Wallet**: Secure storage for licenses, permits, and insurance.
*   **Safety Scorecard**: Gamified safety metrics and coaching.

## 🛠️ Architecture
This project follows **Clean Architecture** principles to ensure scalability, testability, and maintainability.

### Layers
1.  **Domain Layer** (`lib/domain`): Contains Entities and Repository Interfaces. Pure Dart code, no Flutter dependencies.
2.  **Data Layer** (`lib/data`): Implements Repositories and handles data sources (API, Local Storage).
3.  **Presentation Layer** (`lib/presentation`): Contains ViewModels (State Management) and UI Widgets.

### State Management
*   **Provider**: Used for Dependency Injection and State Management (`ChangeNotifier`).
*   **ViewModels**: Encapsulate business logic and expose state to Views.

## 🚀 Getting Started

### Prerequisites
*   [Flutter SDK](https://flutter.dev/docs/get-started/install) (Stable Channel)
*   Android Studio or VS Code with Flutter extensions.

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-org/fleetflow-mobile.git
    cd fleetflow-mobile
    ```

2.  **Install dependencies**:
    ```bash
    flutter pub get
    ```

3.  **Run the app**:
    ```bash
    flutter run
    ```

## 🧪 Testing

### Unit & Widget Tests
Run the comprehensive test suite:
```bash
flutter test
```

### Integration Tests
Run end-to-end tests on a device/emulator:
```bash
flutter test integration_test/app_test.dart
```

## 📦 Building for Release

### Android (APK)
```bash
flutter build apk --release
```

### Android (App Bundle)
```bash
flutter build appbundle
```

## 🎨 Design System
*   **Font**: Roboto (Google Fonts)
*   **Primary Color**: Navy Blue (`#0A1929`)
*   **Accent Color**: Electric Blue (`#2196F3`)
*   **Theme**: Dark Mode First

## 📂 Project Structure
```
lib/
├── core/           # Constants, Utils
├── data/           # Repositories (Impl)
├── domain/         # Entities, Repositories (Interface)
├── presentation/   # ViewModels
├── screens/        # UI Screens
├── theme/          # App Theme
└── widgets/        # Reusable Widgets
```
