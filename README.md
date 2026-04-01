# 🚗 Community CarPool

A full-stack carpooling application for societies and communities. Members can offer rides, request to join trips, and manage payments — all within secure, invite-only communities.

**Live Demo:** https://community-carpool-app.azurewebsites.net

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Registration with Email OTP** | Verify email via OTP (Gmail SMTP / Azure Communication Services) |
| 📱 **Phone, Gender, Age** | Collected during registration for identity verification |
| 🏘️ **Invite-Code Communities** | Create private communities with unique invite links for WhatsApp groups |
| 🔒 **Access Control** | Pre-approved phone list + admin approval gate |
| 👥 **Multi-Admin** | Multiple admins per community with promote/demote |
| 🚗 **Trip Management** | Create trips (simple text or map picker), browse, join |
| 🚀 **Journey Status** | Start journey, track IN_PROGRESS, complete |
| 📞 **Smart Phone Visibility** | Driver/rider phone numbers revealed only when appropriate |
| 💰 **₹ Rupee Pricing** | Distance-based or manual pricing in Indian Rupees |
| 🗺️ **OpenStreetMap Integration** | Leaflet maps with Nominatim search (free, no API key) |
| 🛡️ **Admin Panel** | User management, email broadcasts, stats |
| 📱 **PWA** | Installable on Android as a native-like app |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite 8 + Tailwind CSS 4 |
| **Backend** | Node.js 22 + Express 5 |
| **Database** | PostgreSQL (production) / SQLite (local dev) |
| **ORM** | Prisma |
| **Auth** | JWT + bcrypt |
| **Email** | Nodemailer (Gmail SMTP / Azure Communication Services) |
| **Maps** | Leaflet + OpenStreetMap + Nominatim |
| **Hosting** | Azure App Service + Azure Database for PostgreSQL |

---

## 📁 Project Structure

```
community-carpool/
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── components/              # Navbar, ProtectedRoute, LocationPicker, etc.
│   │   ├── context/AuthContext.jsx   # Auth state management
│   │   └── pages/                   # All page components
│   ├── public/                      # PWA manifest, icons, service worker
│   ├── capacitor.config.json        # Android APK config
│   └── vite.config.js
│
├── server/                          # Node.js backend (Express)
│   ├── prisma/schema.prisma         # Database schema
│   ├── src/
│   │   ├── config/db.js             # Prisma client
│   │   ├── middleware/              # auth.js, admin.js
│   │   ├── routes/                  # auth, trips, joinRequests, credits, communities, admin
│   │   └── utils/                   # email.js, sms.js, haversine.js, credits.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites

- **Node.js** 22+ ([download](https://nodejs.org/))
- **npm** (comes with Node.js)
- Git

### 1. Clone the repo

```bash
git clone https://github.com/kusumakar99/community-carpool.git
cd community-carpool
```

### 2. Setup Backend

```bash
cd server
npm install
```

Create a `.env` file:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-change-this"
PORT=3001
ADMIN_SECRET="your-admin-setup-secret"

# Gmail SMTP (for email OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-email@gmail.com
```

> **Gmail App Password**: Go to https://myaccount.google.com/apppasswords → create one for "CarPool"

Switch Prisma to SQLite for local development:

```bash
# In prisma/schema.prisma, change:
#   provider = "postgresql"  →  provider = "sqlite"
#   url = env("DATABASE_URL")  →  url = "file:./dev.db"
```

Push the schema and start:

```bash
npx prisma db push
node src/index.js
```

Backend runs on **http://localhost:3001**

### 3. Setup Frontend

```bash
cd ../client
npm install
npx vite --host
```

Frontend runs on **http://localhost:5173** (with API proxy to backend)

### 4. Create Admin Account

```bash
cd ../server
node -e "
const bcrypt = require('bcryptjs');
const p = require('./src/config/db');
(async () => {
  const hash = await bcrypt.hash('YourPassword', 10);
  await p.user.create({
    data: { email:'you@email.com', phone:'+91XXXXXXXXXX', username:'admin', password:hash, role:'admin', gender:'Male', age:30 }
  });
  console.log('Admin created!');
  process.exit(0);
})();
"
```

---

## ☁️ Deploy to Azure

### Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│  Browser / PWA   │────▶│  Azure App Service    │────▶│  Azure Database     │
│  (React SPA)     │     │  (Node.js + static)   │     │  for PostgreSQL     │
└─────────────────┘     └──────────────────────┘     └────────────────────┘
```

### Prerequisites

- **Azure CLI** installed and logged in (`az login`)
- **Azure Subscription** (Visual Studio Enterprise or Pay-as-you-go)

### Step 1: Create Azure Resources

```bash
# Create resource group
az group create --name carpool-rg --location centralindia

# Register providers (first time only)
az provider register --namespace Microsoft.DBforPostgreSQL
az provider register --namespace Microsoft.Web

# Create PostgreSQL database
az postgres flexible-server create \
  --resource-group carpool-rg \
  --name carpool-db-server \
  --location centralindia \
  --admin-user carpooladmin \
  --admin-password "YourDbPassword!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --public-access 0.0.0.0 \
  --yes

# Create the database
az postgres flexible-server db create \
  --resource-group carpool-rg \
  --server-name carpool-db-server \
  --database-name community_carpool

# Create App Service
az appservice plan create \
  --resource-group carpool-rg \
  --name carpool-plan \
  --location centralindia \
  --sku B1 --is-linux

az webapp create \
  --resource-group carpool-rg \
  --plan carpool-plan \
  --name community-carpool-app \
  --runtime "NODE:22-lts"
```

### Step 2: Configure Environment Variables

```bash
# Database URL
az webapp config appsettings set --resource-group carpool-rg \
  --name community-carpool-app \
  --settings DATABASE_URL="postgresql://carpooladmin:YourDbPassword!@carpool-db-server.postgres.database.azure.com:5432/community_carpool?sslmode=require"

# App settings (run each separately)
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings JWT_SECRET=your-production-jwt-secret
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings ADMIN_SECRET=your-admin-secret
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings PORT=8080
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings NODE_ENV=production
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings WEBSITES_CONTAINER_START_TIME_LIMIT=300

# Gmail SMTP
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings SMTP_HOST=smtp.gmail.com
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings SMTP_PORT=587
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings SMTP_SECURE=false
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings SMTP_USER=your-email@gmail.com
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings SMTP_PASS=your-gmail-app-password
az webapp config appsettings set --resource-group carpool-rg --name community-carpool-app --settings SMTP_FROM=your-email@gmail.com
```

### Step 3: Push Database Schema

```bash
cd server

# Make sure schema.prisma has provider = "postgresql" and url = env("DATABASE_URL")
export DATABASE_URL="postgresql://carpooladmin:YourDbPassword!@carpool-db-server.postgres.database.azure.com:5432/community_carpool?sslmode=require"
npx prisma db push
```

### Step 4: Build & Deploy

```bash
# Build frontend
cd client
npx vite build

# Copy built files to server
cp -r dist ../server/public

# Create deploy package
cd ../server
mkdir -p /tmp/deploy
cp package.json package-lock.json /tmp/deploy/
cp -r src prisma public /tmp/deploy/
rm -f /tmp/deploy/prisma/dev.db*
cd /tmp/deploy && zip -r /tmp/deploy.zip .

# Deploy to Azure
az webapp deploy \
  --resource-group carpool-rg \
  --name community-carpool-app \
  --src-path /tmp/deploy.zip \
  --type zip
```

### Step 5: Verify

```bash
curl https://community-carpool-app.azurewebsites.net/api/health
# Should return: {"status":"ok","timestamp":"...","port":"8080"}
```

### Estimated Monthly Cost

| Resource | SKU | ~Cost/month |
|----------|-----|------------|
| App Service | B1 (Linux) | ~$13 |
| PostgreSQL | Burstable B1ms | ~$12 |
| **Total** | | **~$25/month** |

---

## 📱 Build Android APK (Capacitor)

### Prerequisites

- **Android Studio** ([download](https://developer.android.com/studio))
- **Java JDK 17+**

### Step 1: Configure API URL

Create `client/.env.production`:

```env
VITE_API_URL=https://community-carpool-app.azurewebsites.net/api
```

### Step 2: Build & Sync

```bash
cd client

# Build production frontend
npx vite build

# Add Android platform (first time only)
npx cap add android

# Sync web assets to Android project
npx cap sync
```

### Step 3: Build APK in Android Studio

```bash
# Open Android project in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. APK will be at: `client/android/app/build/outputs/apk/debug/app-debug.apk`

### Step 4: Install on Phone

- Transfer the APK to your Android phone
- Enable **"Install from unknown sources"** in Settings
- Tap the APK to install

### Alternative: Install as PWA (No APK needed)

1. Open https://community-carpool-app.azurewebsites.net on **Chrome (Android)**
2. Tap **⋮ menu → "Install app"** or **"Add to Home screen"**
3. The app appears as a native icon on your home screen

---

## 🔒 Security Features

- **Email OTP verification** for registration
- **Invite-code communities** — only members with the code can join
- **Pre-approved phone list** — admin can whitelist phone numbers
- **Admin approval gate** — unknown users need manual approval
- **JWT authentication** with 7-day expiry
- **Password hashing** with bcrypt (10 rounds)
- **Phone visibility rules** — only shown when appropriate
- **Multi-admin** — communities can have multiple admins

---

## 📋 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (sends OTP) |
| POST | `/api/auth/verify-otp` | Verify OTP & create account |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips` | Create trip |
| GET | `/api/trips` | Browse available trips |
| GET | `/api/trips/:id` | Trip details |
| GET | `/api/trips/my/created` | My created trips |
| GET | `/api/trips/my/joined` | My joined trips |
| PATCH | `/api/trips/:id/start` | Start journey |
| PATCH | `/api/trips/:id/complete` | Complete trip (transfers ₹) |
| PATCH | `/api/trips/:id/cancel` | Cancel trip |

### Join Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips/:id/join` | Request to join a trip |
| PATCH | `/api/join-requests/:id/accept` | Accept join request |
| PATCH | `/api/join-requests/:id/reject` | Reject join request |

### Communities
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/communities` | Create community |
| GET | `/api/communities` | List my communities |
| POST | `/api/communities/join` | Join via invite code |
| GET | `/api/communities/preview/:code` | Preview community (public) |
| GET | `/api/communities/:id` | Community details |
| GET | `/api/communities/:id/trips` | Community trips |
| POST | `/api/communities/:id/approved-phones` | Add pre-approved phones |
| GET | `/api/communities/:id/pending-members` | List pending members |
| PATCH | `/api/communities/:id/members/:mid/approve` | Approve member |
| PATCH | `/api/communities/:id/members/:mid/reject` | Reject member |
| PATCH | `/api/communities/:id/members/:mid/promote` | Promote to admin |
| PATCH | `/api/communities/:id/members/:mid/demote` | Demote admin |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/send-email` | Send announcement email |

---

## 📄 License

ISC

---

Built with ❤️ by [Kusumakar Althi](https://github.com/kusumakar99)
