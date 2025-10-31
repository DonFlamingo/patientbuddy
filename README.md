# PatientBuddy

This repository contains a simple AI medical chatbot with a backend (Express + MongoDB) and a React + Vite frontend.

## Overview
- backend/: Express server, authentication, admin routes, and OpenAI integration.
- frontend/vite-project/: React + Vite frontend.

## Quick start (Windows PowerShell)

1. Install dependencies

```powershell
# Backend
cd .\backend
npm install

# Frontend
cd ..\frontend\vite-project
npm install
```

2. Set required environment variables (example values shown)

```powershell
# Set these before running the server (temporary for the session)
$env:JWT_SECRET = 'a_strong_jwt_secret'
$env:MONGODB_URI = 'mongodb://localhost:27017/patientbuddy'
# Optional seed admin credentials
$env:ADMIN_EMAIL = 'admin@patientbuddy.com'
$env:ADMIN_PASSWORD = 'AdminPass123!'
$env:ADMIN_USERNAME = 'admin'
```

3. Create or update the admin user (from backend folder)

```powershell
cd .\backend
npm run seed-admin
```

4. Start backend and frontend separately

```powershell
# Backend
cd .\backend
npm run dev

# Frontend (in a new shell)
cd ..\frontend\vite-project
npm run dev
```

5. Open the frontend in the browser (Vite will print the dev URL, commonly http://localhost:5173). Use the login page to sign in.

## Admin user
- Admins are no longer auto-created during signup. Use the seed script (`npm run seed-admin`) or create/update users directly in the database to set role to `admin`.

## Dev helper (Windows)
A simple PowerShell script `start-dev.ps1` is provided to start backend and frontend in separate PowerShell windows.

Run it from the repository root:

```powershell
.\scripts\start-dev.ps1
```

## Notes
- Ensure `JWT_SECRET` is set and consistent across restarts.
- The admin middleware now verifies the token and fetches the user from the DB to confirm the current role.
- The seed script will create or update an admin user with the credentials provided via `ADMIN_*` env vars.

If you want, I can add a cross-platform npm script to run both processes with a single command (using `concurrently`).
