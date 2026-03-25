# SmartSensrty APK Installation Guide

## 📦 Your APK Files

Two versions have been built and copied to your **Desktop** and **Downloads** folder:

### 1. **SmartSensrty-DEBUG.apk** (160.5 MB)
- For development and testing
- Has logging and debug features enabled
- Use this for testing features

### 2. **SmartSensrty-RELEASE.apk** (63.5 MB)  
- Optimized for production
- Smaller file size
- Better performance
- Use this for normal use

---

## 🛠️ Installation Instructions

### Method 1: USB Cable (Recommended)

#### Step 1: Connect Phone to PC
1. Connect your Android phone to PC with USB cable
2. On phone: Enable **USB Debugging**
   - Go to: **Settings** → **About Phone**
   - Tap **Build Number** 7 times (until "Developer Mode" activates)
   - Go: **Settings** → **Developer Options**
   - Enable **USB Debugging**
   - Accept the security prompt

#### Step 2: Enable Unknown Sources
1. Go to: **Settings** → **Security** or **Privacy**
2. Enable **Install Unknown Apps** OR **Unknown Sources**
   - This varies by Android version

#### Step 3: Copy APK to Phone
**Option A - Using File Manager:**
1. On PC: Copy `SmartSensrty-DEBUG.apk` or `SmartSensrty-RELEASE.apk`
2. Navigate to: `C:\Users\srinath\Desktop\` (or Downloads)
3. Right-click → Copy
4. On Phone: Open File Manager
5. Navigate to Downloads folder
6. Paste the APK file there

**Option B - Using Windows File Explorer:**
1. Open Windows File Explorer
2. Navigate to your Desktop or Downloads
3. Find `SmartSensrty-DEBUG.apk` or `SmartSensrty-RELEASE.apk`
4. Right-click → Send To → Phone (if available)

#### Step 4: Install APK
1. Open File Manager on phone
2. Navigate to where you pasted the APK
3. Tap the APK file
4. Tap **Install**
5. Wait for installation to complete
6. Tap **Open** to launch the app OR close dialog

---

### Method 2: Email/Cloud (Easy)

#### Step 1: Email Yourself
1. Compress the APK file (optional, to reduce size)
2. Email it to yourself
3. On phone: Open email
4. Download the attachment
5. Tap to install

#### Step 2: Google Drive/OneDrive
1. Upload APK to Google Drive or OneDrive
2. On phone: Open Google Drive/OneDrive
3. Download the file
4. Notification appears: Tap to install

#### Step 3: Shared Cloud
1. Use WeTransfer, ShareIt, or similar
2. Send link to yourself
3. Open on phone, download, and install

---

### Method 3: ADB (Advanced)

If you have ADB installed on PC:

```bash
# Debug APK
adb install C:\Users\srinath\Desktop\SmartSensrty-DEBUG.apk

# OR Release APK
adb install C:\Users\srinath\Desktop\SmartSensrty-RELEASE.apk
```

---

## ✅ Verification

After installation, verify it worked:

1. ✅ App appears in your phone's app drawer
2. ✅ App icon shows "SmartSensrty"
3. ✅ Tap to open - should not crash
4. ✅ Run first time setup
5. ✅ All features work

---

## 🔍 Troubleshooting

### "Unknown Source" Error
- **Solution**: Go to Settings → Security → Enable "Unknown Sources"

### "Installation Blocked"
- **Solution**: 
  1. Check file size
  2. Clear phone storage (free at least 500MB)
  3. Try RELEASE version (smaller)

### "Parse Error" or Won't Install
- **Solution**:
  1. Delete corrupted download
  2. Copy file again from Desktop
  3. Try different cable/port
  4. Restart phone and PC

### App Crashes on Launch
- **Solution**:
  1. Uninstall completely
  2. Clear cache: Settings → Storage → Clear Cache
  3. Reinstall fresh
  4. Check Render backend is deployed (for API features)

### "Not from Google Play Store" Warning
- **Solution**: This is normal for sideloaded apps
  - Tap **Install Anyway** or **More Info** → **Install**

---

## 📱 After Installation

### First Launch
1. Grant permissions:
   - ✅ Location (required for GPS)
   - ✅ Camera (for evidence, if available)
   - ✅ Microphone (for alerts)
   - ✅ Contacts (for emergency contacts)
   - ✅ Files (for offline maps)

2. Login with your credentials
3. Test SOS features
4. Configure emergency contacts

### Testing API Features
- Ensure Render backend is deployed
- JWT_SECRET is set in Render
- MONGODB_URI is set in Render
- Try Emergency History screen (should load or show helpful error)

---

## 🚀 Recommended Installation

**For Testing**: Use **DEBUG APK**
- Has better logging
- Good for seeing what's happening
- Slightly larger

**For Normal Use**: Use **RELEASE APK**  
- Optimized and smaller
- Better performance
- Cleaner experience

---

## 📞 If You Need Help

Check these areas:

1. **App won't open?**
   - Check Render backend status
   - Restart phone
   - Clear app cache

2. **API features not working?**
   - Check Render deployment
   - Check environment variables
   - Use Test API button (in Emergency History)

3. **Can't install?**
   - Free phone storage (500MB+)
   - Enable Unknown Sources
   - Try different USB port
   - Restart phone and PC

---

## 📋 File Locations

**On Your PC:**
- **Desktop**: C:\Users\srinath\Desktop\SmartSensrty-*.apk
- **Downloads**: C:\Users\srinath\Downloads\SmartSensrty-*.apk
- **Build Folder**: c:\Users\srinath\Downloads\CLALP\SmartSensrty\android\app\build\outputs\apk\

**File Details:**
```
SmartSensrty-DEBUG.apk
├─ Size: 160.5 MB
├─ Type: Debug build with logging
├─ Built: 13-02-2026 23:37
└─ Min Android: 5.0+

SmartSensrty-RELEASE.apk
├─ Size: 63.5 MB
├─ Type: Optimized release build
├─ Built: 13-02-2026 22:18
└─ Min Android: 5.0+
```

---

## 🎉 You're Ready!

Both APK files are ready for manual installation. Choose DEBUG or RELEASE based on your needs, then follow the installation steps above. Good luck! 🚀
