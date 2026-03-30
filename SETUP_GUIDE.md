# MIT Connect — Complete Setup Guide

> **Last verified:** March 2026 | Python 3.12 | Node.js 22 | Vite 7

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Structure](#2-project-structure)
3. [Quick Start (One Command)](#3-quick-start-one-command)
4. [Manual Setup — Step by Step](#4-manual-setup--step-by-step)
5. [MongoDB Atlas Configuration](#5-mongodb-atlas-configuration)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Ports & URLs](#7-ports--urls)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

Install these **before** cloning the project:

| Tool | Minimum Version | Download Link | Check Command |
|------|----------------|---------------|---------------|
| **Python** | 3.10+ | [python.org/downloads](https://www.python.org/downloads/) | `python --version` or `py --version` |
| **pip** | (comes with Python) | — | `pip --version` |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) | `node --version` |
| **npm** | 9+ (comes with Node) | — | `npm --version` |
| **Git** | Any | [git-scm.com](https://git-scm.com/) | `git --version` |

> **MongoDB Atlas** — You need an account at [cloud.mongodb.com](https://cloud.mongodb.com). The project uses a **cloud-hosted** MongoDB database (no local MongoDB installation needed).

---

## 2. Project Structure

```
cms/
├── backend/                 ← FastAPI + Python
│   ├── main.py              ← App entry point
│   ├── db.py                ← Self-healing MongoDB connection
│   ├── .env                 ← MongoDB URI goes here
│   ├── requirements.txt     ← Python dependencies
│   ├── routes/              ← API route handlers
│   ├── utils/               ← Helpers (serialize, etc.)
│   └── dev_store.py         ← Fallback data when DB is offline
│
├── frontend/                ← React + Vite
│   ├── src/                 ← React components & pages
│   ├── package.json         ← Node dependencies
│   ├── vite.config.js       ← Dev server + API proxy config
│   └── index.html           ← HTML entry point
│
├── start.bat                ← Windows one-click launcher
├── render.yaml              ← Render.com deployment config
└── SETUP_GUIDE.md           ← This file
```

---

## 3. Quick Start (One Command)

**Windows only** — Double-click or run from terminal:

```bat
cd d:\Clg_mangt\cms
start.bat
```

This will:
1. Install frontend npm dependencies
2. Install backend Python dependencies
3. Start the FastAPI backend in a new terminal window (port 8000)
4. Start the Vite dev server in a new terminal window (port 5173)

---

## 4. Manual Setup — Step by Step

### Step 1: Clone the repository

```bash
git clone <your-repo-url>
cd cms
```

---

### Step 2: Backend Setup

#### 2a. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `motor` (≥3.0) | Async MongoDB driver |
| `pymongo` (≥4.0) | MongoDB driver |
| `python-dotenv` | Load `.env` files |
| `pydantic` | Data validation |
| `reportlab` | PDF generation (payslips) |

#### 2b. Configure the MongoDB connection

Create or edit `backend/.env`:

```env
MONGODB_URI=mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/College_db
```

> ⚠️ **If you're using your own Atlas cluster**, replace the entire URI with your own connection string. See [Section 5](#5-mongodb-atlas-configuration) for how to get it.

#### 2c. Start the backend

From the **project root** (`cms/` directory):

```bash
cd d:\Clg_mangt\cms
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Or using the `py` launcher (Windows):

```bash
py -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

**Expected output:**

```
✅ MongoDB CONNECTED at mongodb+srv://cluster0.crvutrr.mongodb.net (Database: College_db)
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Started reloader process
```

If the connection fails you'll see:

```
❌ MongoDB connect FAILED for mongodb+srv://cluster0.crvutrr.mongodb.net: ...
⚠️  INITIAL MongoDB connection failed. Background reconnection is ACTIVE — will keep retrying.
🔄 MongoDB reconnecting (retry in 5s)…
```

The server **will still start** and will keep retrying in the background.

#### 2d. Verify the backend is running

Open: [http://localhost:8000/docs](http://localhost:8000/docs) → You should see the FastAPI Swagger UI.

Or check health: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- `{"status": "ok", "database": "connected"}` → All good
- `{"status": "reconnecting", "database": "disconnected"}` → DB is reconnecting

---

### Step 3: Frontend Setup

Open a **second terminal**:

#### 3a. Install Node.js dependencies

```bash
cd d:\Clg_mangt\cms\frontend
npm install
```

#### 3b. Start the Vite dev server

```bash
npm run dev
```

**Expected output:**

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

#### 3c. Open the website

Open: [http://localhost:5173](http://localhost:5173) → You should see the MIT Connect login page.

---

## 5. MongoDB Atlas Configuration

### Getting your connection string

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and sign in
2. Select your cluster (e.g., `Cluster0`)
3. Click **"Connect"** → **"Connect your application"**
4. Choose **Driver: Python** and **Version: 3.12 or later**
5. Copy the connection string — it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/<dbname>
   ```
6. Replace `<username>`, `<password>`, and `<dbname>` with your actual values
7. Paste it into `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxxx.mongodb.net/College_db
   ```

### IP Whitelisting (CRITICAL)

This is the **#1 cause of connection failures**:

1. In Atlas, go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Either:
   - Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`) — easiest for development
   - Or add your current IP address specifically
4. Click **Confirm**
5. **Wait 1-2 minutes** for the change to propagate

> 💡 **Tip**: Your home IP changes frequently. If the app was working yesterday but not today, re-check your IP whitelist.

### Database Name

The project expects a database named **`College_db`**. This is specified in:
- The URI itself: `mongodb+srv://...mongodb.net/College_db`
- Fallback in `db.py`: hardcoded as `client["College_db"]`

If your Atlas database is named differently, update both places.

---

## 6. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | **Yes** | Hardcoded Atlas fallback | Full MongoDB connection string |
| `PORT` | No | `8000` | Backend server port |
| `CORS_ORIGINS` | No | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins |

### Frontend (optional, usually not needed for local dev)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | (empty — uses Vite proxy) | Override API base URL |
| `VITE_API_PROXY_TARGET` | No | `http://127.0.0.1:8000` | Backend URL for Vite proxy |

> For **local development** you don't need any frontend environment variables. The Vite proxy automatically forwards `/api/*` requests to `http://127.0.0.1:8000`.

---

## 7. Ports & URLs

| Service | URL | Port |
|---------|-----|------|
| **Frontend** (Vite dev server) | http://localhost:5173 | 5173 |
| **Backend** (FastAPI/Uvicorn) | http://localhost:8000 | 8000 |
| **API Docs** (Swagger UI) | http://localhost:8000/docs | 8000 |
| **Health Check** | http://localhost:8000/api/health | 8000 |

### How API requests flow (local dev):

```
Browser → http://localhost:5173/api/students
                ↓ (Vite proxy)
         http://127.0.0.1:8000/api/students
                ↓ (FastAPI route)
         MongoDB Atlas (cloud)
```

---

## 8. Troubleshooting

### ❌ "Connection Error" banner on Students/Faculty/Departments pages

| Cause | Fix |
|-------|-----|
| Backend not running | Start the backend (Step 2c) |
| MongoDB Atlas IP not whitelisted | Go to Atlas → Network Access → Add your IP |
| Atlas cluster paused (free tier) | Go to Atlas dashboard → Resume cluster |
| Wrong credentials in `.env` | Verify username/password in `MONGODB_URI` |
| DNS/SRV blocked (corporate network) | Use a personal network or VPN |

**The backend now auto-retries** — check the backend terminal for `🔄 MongoDB reconnecting…` and `✅ MongoDB CONNECTED` messages.

---

### ❌ `python` / `py` command not found

- Windows: Install Python from [python.org](https://www.python.org/) and check **"Add to PATH"** during install
- Or use `py` instead of `python` (Windows Python Launcher)

---

### ❌ `npm install` fails

```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ Port 8000 or 5173 already in use

```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill by PID
taskkill /PID <PID> /F
```

Or change the port:
```bash
# Backend on port 9000
python -m uvicorn backend.main:app --reload --port 9000

# Tell Vite to proxy to port 9000
set VITE_API_PROXY_TARGET=http://127.0.0.1:9000
npm run dev
```

---

### ❌ CORS errors in browser console

This usually means the backend isn't running on `localhost:8000`. Verify:
1. Backend is running (check terminal)
2. Vite proxy is working — the Vite config automatically proxies `/api/*` to `http://127.0.0.1:8000`
3. You're accessing the app via `http://localhost:5173` (not directly `localhost:8000`)

---

### ❌ Backend starts but shows "Database is temporarily unavailable"

The backend is running but MongoDB isn't connected yet. Check:
1. `backend/.env` has the correct `MONGODB_URI`
2. Your IP is whitelisted in Atlas
3. The backend terminal — watch for `🔄 reconnecting…` → `✅ CONNECTED` messages
4. Hit `http://localhost:8000/api/health` to check status

---

### ❌ Pages load but show mock/old data instead of real DB data

This means MongoDB connection is failing and the app is falling back to `dev_store.py`. Fix the MongoDB connection (see above) and the pages will auto-refresh with real data.

---

### ❌ `ModuleNotFoundError: No module named 'backend'`

You must run uvicorn from the **project root** (`cms/`), not from inside `backend/`:

```bash
# ✅ Correct — from cms/ directory
cd d:\Clg_mangt\cms
python -m uvicorn backend.main:app --reload

# ❌ Wrong — from backend/ directory
cd d:\Clg_mangt\cms\backend
python -m uvicorn main:app --reload    # Import errors!
```

---

## Running Both Services — Summary Cheat Sheet

### Terminal 1 (Backend):
```bash
cd d:\Clg_mangt\cms
py -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2 (Frontend):
```bash
cd d:\Clg_mangt\cms\frontend
npm run dev
```

### Then open:
**http://localhost:5173** ← The website
