# Taskbora Deployment Guide

This guide walks you through deploying **Taskbora** to production:
- **Backend API**: Deployed to **Vercel** (Express Serverless) or Render / Railway
- **Frontend App**: Deployed to **Netlify** or **Vercel** (React + Vite)
- **Database**: **Supabase** (PostgreSQL) — works globally across any network/device with no IP whitelisting needed!

---

## 1. Supabase Database Setup (One-time, 1 minute)

1. Open your project on [Supabase](https://supabase.com/dashboard).
2. On the left sidebar, click the **SQL Editor** tab (terminal icon `>_`).
3. Click **"New query"**.
4. Open [server/supabase_schema.sql](file:///c:/Users/zekov/Desktop/CodeAlpha_ProjectManagementTool/server/supabase_schema.sql) in this repo, copy its entire contents, paste it into the Supabase SQL Editor, and click **"Run"**.
5. All 6 tables (`users`, `projects`, `project_members`, `tasks`, `comments`, `activities`) will be created instantly with indexes and triggers.

---

## 2. Deploy Backend API to Vercel

1. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Import the `CodeAlpha_ProjectManagementTool` repository.
3. In the project setup screen:
   - **Framework Preset**: Other
   - **Root Directory**: Click "Edit" and select `server`
4. Expand **Environment Variables** and add the following:

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enables production security & optimizations |
| `SUPABASE_URL` | `https://yczjfywqrthxwfvaonac.supabase.co` | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` | Supabase secret/service_role key |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Supabase publishable key |
| `JWT_SECRET` | `tsk_9f3c1a2e7b8d4056af1e9c3b7d20648e5a1c9f3e2b6d40571` | At least 32 characters |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `CLIENT_ORIGIN` | `https://your-app.netlify.app` | Exact HTTPS URL of your frontend (supports multiple comma-separated URLs) |
| `COOKIE_SECURE` | `true` | Required for HTTPS cross-site cookies |
| `AUTH_COOKIE_NAME` | `taskbora_token` | Auth cookie identifier |
| `SYSTEM_ADMIN_EMAIL` | `admin@gmail.com` | Email address of the primary platform admin |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP host for password reset emails |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USER` | `cabdale13yare@gmail.com` | Gmail/SMTP username |
| `EMAIL_PASS` | `qeeiecdlavlbvkxl` | Gmail App Password (16 characters) |
| `EMAIL_FROM` | `Taskbora <cabdale13yare@gmail.com>` | Sender address |

5. Click **Deploy**.
6. When deployment finishes, copy your Vercel URL (e.g. `https://taskbora-api.vercel.app`).
7. Test the health endpoint in your browser:
   `https://taskbora-api.vercel.app/api/health` → should return `{"success": true, "data": {"status": "ok", ...}}`.

---

## 3. Deploy Frontend (Option A: Netlify)

1. Log in to [Netlify](https://netlify.com) and click **"Add new site"** -> **"Import an existing project"**.
2. Select your GitHub repository.
3. In the build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist` (or `client/dist`)
4. Expand **Environment variables** and add:

| Variable | Value | Notes |
|---|---|---|
| `VITE_API_URL` | `https://your-api.vercel.app/api` | Your backend API URL (code auto-normalizes missing `/api` or trailing slashes) |

5. Click **Deploy Taskbora**.
6. Once deployed, copy your Netlify URL (e.g. `https://taskbora.netlify.app`).
7. **Crucial Step**: Go back to your Vercel backend project settings -> **Environment Variables** -> update `CLIENT_ORIGIN` to match your exact Netlify domain:
   `CLIENT_ORIGIN=https://taskbora.netlify.app`
8. Redeploy the backend (or Promote latest deployment) so the new `CLIENT_ORIGIN` takes effect.

---

## 4. Deploy Frontend (Option B: Vercel)

If you prefer deploying the frontend to Vercel instead of Netlify:

1. In Vercel, click **"Add New Project"** and import the same repository again.
2. In the project setup:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
3. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-api.vercel.app/api`
4. Click **Deploy**.
5. Client-side routing is automatically handled by `client/vercel.json` (`/*` rewrites to `/index.html`).
6. Update `CLIENT_ORIGIN` on your backend project to your Vercel frontend domain:
   `CLIENT_ORIGIN=https://taskbora-client.vercel.app`

---

## 5. Pre-Flight Verification Checklist

Before sharing your live link:

- [ ] **Health Check**: Open `https://your-api.vercel.app/api/health` — returns status `ok`.
- [ ] **Registration**: Register a new user on your frontend. Verify you are automatically logged in and redirected to `/`.
- [ ] **Page Refresh**: Refresh the browser while on `/projects` or `/tasks` — page reloads without a 404 error (handled by `_redirects` / `vercel.json`).
- [ ] **Task Creation & Board**: Create a project and add a task. Confirm drag/drop or status changes persist.
- [ ] **Reports & Analytics**: Visit `/analytics` and test **"Download PDF Report"** and **"Export CSV"**.
- [ ] **Logout & Login**: Log out and log back in to verify session cookies transmit securely across origins.
