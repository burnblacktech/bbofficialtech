# Google OAuth Redirects (App vs Landing)

## Problem this prevents

Google OAuth callback redirects are built server-side in `backend/src/routes/auth.js` using `FRONTEND_URL`. If `FRONTEND_URL` is set to a **marketing/landing** domain instead of the **app** domain, users will correctly authenticate with Google but then be redirected to the landing site (where the app routes don’t exist).

## Current solution (origin-aware redirects)

### 1) Frontend sends `redirectBase`

When starting Google OAuth, the frontend now appends:

- `redirectBase=<window.location.origin>`

Implementation: `frontend/src/services/api/authService.js` (`googleLoginRedirect()`).

### 2) Backend stores validated `redirectBase` in session

On `GET /api/auth/google`, backend:

- Validates `redirectBase` (protocol + host allowlist)
- Stores it as `req.session.oauthRedirectBase` (origin only)
- Uses it for **all** Google OAuth success and error redirects

Implementation: `backend/src/routes/auth.js` (`validateOAuthRedirectBase()`, `getOAuthFrontendUrl()`).

### 3) Frontend forces `/home` after OAuth success

After processing the token and storing it, `frontend/src/pages/Auth/GoogleOAuthSuccess.js` performs `window.location.replace('/home')` to guarantee we land on the protected smart redirect route.

## Security: allowlist to prevent open redirects

Backend accepts `redirectBase` only if host matches:

- `FRONTEND_URL` host (if set), OR
- one of `ALLOWED_OAUTH_REDIRECT_HOSTS` (comma-separated), OR
- local dev defaults (`localhost:3000`, `127.0.0.1:3000`)

Set this in production if you have multiple app domains:

```bash
ALLOWED_OAUTH_REDIRECT_HOSTS=app.burnblack.com,staging-app.burnblack.com
```

## Recommended deployment config

- **`FRONTEND_URL`**: should point to the **SPA app** domain (not marketing landing)
- Ensure your hosting (e.g., Vercel) rewrites SPA routes like `/auth/google/success` and `/home` to `index.html`


