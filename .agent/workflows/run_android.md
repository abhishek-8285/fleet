---
description: How to run the FleetFlow mobile app in Android Studio
---

# Running FleetFlow Mobile in Android Studio

Since the `android/` directory already exists, you can open the native project directly in Android Studio.

## Prerequisites
- Android Studio installed
- Android SDK installed
- An Android Virtual Device (AVD) created or a physical device connected via USB

## Steps

1.  **Open Android Studio**
2.  Select **"Open"** (or "Open an Existing Project").
3.  Navigate to and select the `mobile/android` folder:
    ```text
    /home/abhishek/Desktop/fleet/mobile/android
    ```
4.  Wait for Gradle sync to complete (this may take a few minutes).
5.  **Run the App**:
    - Select your device/emulator from the dropdown in the top toolbar.
    - Click the green **Play** button (Run 'app').

## Alternative: Command Line
You can also build and launch the Android app directly from the terminal without opening the full IDE GUI:

```bash
cd mobile
npx expo run:android
```
This command will:
1.  Build the native Android app.
2.  Launch the emulator (if none is running).
3.  Install and start the app.

## Troubleshooting
- **Gradle Errors**: If you see build errors, try cleaning the project:
    - In Android Studio: `Build > Clean Project`
    - Or terminal: `cd mobile/android && ./gradlew clean`
- **Metro Bundler**: Ensure the Metro bundler is running. `npx expo run:android` usually starts it, but if the app crashes on launch, run `npx expo start` in a separate terminal.
