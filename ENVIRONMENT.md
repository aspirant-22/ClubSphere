/**
 * @FILE: ENVIRONMENT.md
 * @RESPONSIBILITY: Master configuration dictionary, environment variable specifications, and local runbook.
 * @DEPENDENCIES: Node.js server and Vite client environments.
 * @MODIFICATION_HOTSPOT: Variable definitions and default ports.
 * @AUTHOR: Garima Mittal
 */

# 🌐 ClubSphere: Environment Configuration & Runbook

### 1. Server Environment Variables (`server/.env`)

```ini
# Application Gateway Port & Environment
NODE_ENV=development
PORT=5000
SERVER_BASE_URL=http://localhost:5000

# Client Application URL (For CORS Whitelist)
CLIENT_ORIGIN_URL=http://localhost:5173

# Database Connection (MongoDB)
MONGODB_URI=mongodb://127.0.0.1:27017/clubsphere_erp

# Security & Session Token Isolation
JWT_SECRET_KEY=clubsphere_enterprise_super_secret_jwt_key_2026_skyline
JWT_EXPIRATION_HOURS=24
COOKIE_SECRET=clubsphere_secure_cookie_signer_salt_9988

# Rate Limiting Parameters
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500

# Enterprise ERP Defaults
ERP_DEFAULT_CURRENCY=INR
ERP_TAX_RATE_PERCENTAGE=18.00
```

### 2. Client Environment Variables (`client/.env`)

```ini
# Vite Client Network Configuration
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_SERVER_URL=http://localhost:5000
VITE_APP_NAME="ClubSphere - Skyline Student Association"
VITE_API_TIMEOUT_MS=8000
```

### 3. Local Development Runbook
1. **Database:** Ensure MongoDB is running locally on port 27017 (`mongod --dbpath <data_dir>`).
2. **Server Launch:**
   ```bash
   cd server
   npm install
   npm run seed    # Populates 200+ historical mock documents
   npm run dev     # Starts Express + Socket.IO server on port 5000
   ```
3. **Client Launch:**
   ```bash
   cd client
   npm install
   npm run dev     # Starts Vite development server on port 5173
   ```

