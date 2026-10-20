# Taskora

Plan projects. Manage tasks. Work together.

Taskora is a full-stack project management workspace for teams that need a clear view of projects, tasks, ownership, and progress. This repository is named `CodeAlpha_ProjectManagementTool` for the CodeAlpha Full Stack Development internship. The product name throughout the application is **Taskora**.

## Current status

Authentication and project management are in place: registration, login, HttpOnly JWT cookies, protected routes, project CRUD, membership, and access control. Tasks, comments, activity, dashboard metrics, and deployment configuration follow in later phases.

## Features (planned and in progress)

- Account registration, login, logout, and protected routes
- Projects, membership, and permission checks
- Task boards with persisted status changes
- Comments and activity history
- Dashboard metrics from live workspace data
- Light and dark themes

## Technology stack

- Frontend: React, Vite, JavaScript, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Auth: JWT stored in an HttpOnly cookie (`taskora_token`), not in `localStorage`
- Tests: Vitest, React Testing Library, Node.js test runner, Supertest

## Screenshots

Add product screenshots here after the interface is further along.

- Login
- Dashboard
- Project board

## Local setup

Requirements: Node.js 20 or later, npm, and optionally a local MongoDB instance.

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

`server/.env` should use placeholder or local values only. Never commit real credentials.

Start both apps:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000
- Health: http://localhost:5000/api/health

The Vite dev server proxies `/api` to the Express process.

## Authentication strategy

Taskora will store session JWTs in HttpOnly cookies, not in `localStorage`. Cookies will use `SameSite=Lax` (or `None` plus `Secure` if a cross-site production deployment requires it), `Secure` in production, and credentialed CORS against a configured frontend origin. This reduces exposure to XSS-based token theft compared with storing tokens in JavaScript-accessible storage.

## Testing

```bash
npm test
npm run lint
npm run build
```

Backend authentication tests use a dedicated local database at `mongodb://127.0.0.1:27017/taskora_test` and drop that database after the suite finishes. Keep MongoDB running locally before `npm test`.

## Deployment

See `DEPLOYMENT.md` once the deployment phase is complete. Planned hosting: Netlify for the frontend, Vercel for the API, and MongoDB Atlas for the database.
