# Smart Sentry
<p align="center"> <img src="https://res.cloudinary.com/notes1/image/upload/WhatsApp_Image_2026-02-13_at_00.33.52_bae5be.jpg" width="220" /> <img src="https://res.cloudinary.com/notes1/image/upload/WhatsApp_Image_2026-02-13_at_00.33.53_sxcefj.jpg" width="220" /> <img src="https://res.cloudinary.com/notes1/image/upload/WhatsApp_Image_2026-02-13_at_00.33.54_1_gbb4y5.jpg" width="220" /> <img src="https://res.cloudinary.com/notes1/image/upload/WhatsApp_Image_2026-02-13_at_00.39.57_wuobtl.jpg" width="220" /> </p>
A React Native app for personal safety and emergency management, featuring stylish authentication screens and MongoDB backend.

## Features

- **Stylish Authentication**: Beautiful login and register screens with animations, gradients, and professional UI
- **Profile Management**: User registration with profile picture selection from gallery
- **Backend Integration**: Node.js/Express server with MongoDB for data persistence
- **JWT Authentication**: Secure token-based authentication
- **Emergency Features**: SOS functionality and trusted contacts management
- **Cross-Platform**: Works on both Android and iOS

## Prerequisites

- Node.js (v14 or higher)
- React Native development environment
- MongoDB (local or Atlas)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Install iOS dependencies (macOS only):
   ```bash
   cd ios && bundle exec pod install
   ```

3. Set up the backend (see backend README):
   ```bash
   cd smartsensrty-backend
   npm install
   npm start
   ```

## Running the App

### Start Metro Bundler
```bash
npm start
```

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## Backend Setup

The app requires a backend server for authentication and data storage. See `smartsensrty-backend/README.md` for detailed setup instructions.

### For Physical Device Testing

Update `src/services/api.js` with your computer's local IP:
```javascript
const BASE_URL = 'http://YOUR_LOCAL_IP:5000/api';
```

## Enhanced Features

### Login Screen
- Animated shield logo with pulsing effects
- Email/password input with icons
- Remember Me checkbox
- Forgot Password link
- Social login buttons (Google, Facebook, Apple)
- Gradient backgrounds and smooth animations

### Register Screen
- Profile picture selection from gallery
- Full user information collection (name, email, phone, address)
- Professional form design with validation
- Animated UI elements

### Backend Features
- User registration and authentication
- Password hashing with bcrypt
- JWT token generation
- MongoDB data storage
- Profile image support
- RESTful API endpoints

## Original React Native Setup

This is a [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Troubleshooting

If you're having issues, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
