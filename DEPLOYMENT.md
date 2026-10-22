# Taskora Deployment

This repository is prepared for Netlify (React/Vite), Vercel (Express API), and MongoDB Atlas. No hosting account, paid service, or live deployment is included.

## MongoDB Atlas

1. Create a MongoDB Atlas free-tier cluster if available in your region.
2. Create a database user and copy the connection string for the Taskora database.
3. Add the Vercel deployment's outbound access as allowed by your Atlas network-access policy. Avoid opening access broadly unless necessary; Atlas/Vercel network options can vary by plan.
4. Set `MONGODB_URI` in Vercel to the private connection string. Never put it in the client environment or commit it.

## Vercel API

1. Import the repository into Vercel and set the project Root Directory to `server`.
2. The `server/api/index.js` function initializes the Express app and reuses the Mongoose connection between warm invocations. `server/vercel.json` rewrites `/api/*` requests to the function.
3. Configure these Vercel environment variables:

```text
NODE_ENV=production
MONGODB_URI=<Atlas connection string>
JWT_SECRET=<random secret with at least 32 characters>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://<your-netlify-site>.netlify.app
COOKIE_SECURE=true
AUTH_COOKIE_NAME=taskora_token
SYSTEM_ADMIN_EMAIL=<email for the first system admin>
SYSTEM_ADMIN_BOOTSTRAP_TOKEN=<long random one-time token>
```

4. Deploy and verify `https://<your-vercel-host>/api/health` returns a healthy API response.
5. After deployment, configure the frontend origin exactly (scheme and hostname) in `CLIENT_ORIGIN`. Credentialed CORS requires an exact origin.

## Netlify Frontend

1. Import the same repository into Netlify and set the Base directory to `client`.
2. Set the build command to `npm run build` and publish directory to `dist`.
3. Set `VITE_API_URL=https://<your-vercel-host>/api` in the Netlify environment variables, then redeploy. Vite variables are embedded at build time.
4. The `client/public/_redirects` SPA fallback serves the application for nested routes.

## Cross-origin authentication

The frontend and API run on different hosts. Production auth cookies therefore require HTTPS, `SameSite=None`, and `Secure`; the API enables credentialed CORS for the exact `CLIENT_ORIGIN`, and the client sends requests with credentials. Do not use a wildcard CORS origin. Browser third-party-cookie restrictions can vary, so verify registration, login, refresh, logout, and protected-page reloads in the target browser after deployment. If the chosen hosts block cross-site cookies, use same-site custom domains or a same-origin proxy before production use.

## First system administrator

1. Configure `SYSTEM_ADMIN_EMAIL` and a one-time `SYSTEM_ADMIN_BOOTSTRAP_TOKEN` in Vercel before deploying.
2. Register and sign in using the configured email.
3. Visit `/admin/setup` on the Netlify site and submit the one-time token.
4. Confirm the admin console at `/admin` works, then remove `SYSTEM_ADMIN_BOOTSTRAP_TOKEN` from Vercel and redeploy. Public registration cannot grant system-admin privileges.

Keep all secrets in hosting-provider environment settings. Never paste passwords, JWT secrets, MongoDB credentials, or the bootstrap token into source control or chat. The `.env.example` files are examples only and contain no working credentials.
