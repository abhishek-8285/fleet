# 📱 How to Run in Android Studio (Visual Guide)

Follow these steps to open the app inside Android Studio and see it working.

### Step 1: Open Android Studio
Launch the **Android Studio** application on your computer.

### Step 2: Open the Project
1.  Click **"Open"** (or "File > Open").
2.  Navigate to the `fleet` folder on your Desktop.
3.  **Important**: Go inside `mobile` and select the `android` folder.
    *   Path: `.../Desktop/fleet/mobile/android`
    *   *Note: Do not select the main 'fleet' or 'mobile' folder. Select 'android'.*
4.  Click **OK** / **Open**.

### Step 3: Wait for Sync
1.  Android Studio will start "Syncing" (downloading tools).
2.  Look at the bottom-right status bar. Wait until all loading bars finish.
3.  This might take 5-10 minutes for the first time.

### Step 4: Select a Device
1.  Look at the top toolbar.
2.  You should see a dropdown menu with a phone icon.
3.  Select an emulator (e.g., "Pixel_3a_API_34") or your connected phone.
4.  *If the list is empty, click "Device Manager" on the right sidebar to create a new virtual device.*

### Step 5: Click Play
1.  Click the green **▶️ (Play)** button in the top toolbar.
2.  The emulator will pop up.
3.  The app will build and launch automatically.

---
### 💡 Troubleshooting
*   **"SDK Location not found"**: If asked, point it to your Android SDK folder (usually handled automatically).
*   **Build Fails**: Go to **Build > Clean Project**, then try running again.
