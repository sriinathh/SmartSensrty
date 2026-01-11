# Smart Sentry Backend

A Node.js backend for the Smart Sentry React Native app, providing authentication and user management with MongoDB.

## Features

- User registration and login with JWT authentication
- Password hashing with bcrypt
- MongoDB for data storage
- Profile image support
- CORS enabled for mobile app

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. Navigate to the backend directory:
   ```bash
   cd smartsensrty-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/smartsensrty
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   ```

4. Start MongoDB service (if using local MongoDB):
   ```bash
   # On Windows
   net start MongoDB
   # Or start mongod directly
   mongod
   ```

5. Start the server:
   ```bash
   npm start
   # Or for development with auto-restart
   npm run dev
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### User Profile
- `GET /api/profile` - Get user profile (requires auth)

### Contacts (Placeholder)
- `GET /api/contacts` - Get user contacts
- `POST /api/contacts` - Add contact

### SOS (Placeholder)
- `POST /api/sos/start` - Log emergency

## Testing on Physical Device

For testing on a physical Android/iOS device:

1. Find your computer's local IP address
2. Update `src/services/api.js` BASE_URL to use your IP:
   ```javascript
   const BASE_URL = 'http://YOUR_LOCAL_IP:5000/api';
   ```
3. Make sure your device and computer are on the same Wi-Fi network
4. Ensure firewall allows connections on port 5000

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `PORT` - Server port (default: 5000)