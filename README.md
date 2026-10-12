# Mock Role-Based Login App

A mock Next.js 16 (App Router) app with these features:

- username/password signup and login
- **Sign in with Microsoft** (Entra ID, auth code + PKCE via `@azure/msal-node`)
- first-time onboarding
- role-based dashboards (`admin`, `user`)
- **forgot password** for username/password accounts, via emailed reset links ([Resend](https://resend.com), with a console fallback for development)

Supabase is used **only as a Postgres database**, server-side with the service role key. Supabase Auth is not used. Sessions are jose-signed JWTs stored in an httpOnly cookie.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), TypeScript, React 19.3 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Database | Supabase Postgres via `@supabase/supabase-js` (service role, server only) |
| Passwords | `bcryptjs` (cost 12) |
| Sessions | `jose` HS256 JWT, cookie `session` (httpOnly, sameSite=lax, secure in production) |
| Microsoft login | `@azure/msal-node` `ConfidentialClientApplication`, PKCE + `state` |
| Validation | `zod` |
| Email | `resend` (optional; reset links are logged to the console without it) |

## Setup

### 1. Install

Requires Node.js 20.9+.

```bash
npm install
```

### 2. Create the database

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations in order:
   1. [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)
   2. [`supabase/migrations/002_password_reset.sql`](supabase/migrations/002_password_reset.sql). This adds the `password_reset_tokens` table, the `users.password_changed_at` column, and a unique index on password users' emails.

   You can either:
   - paste each file into **SQL Editor** and run it, or
   - with the Supabase CLI linked to the project, run `supabase db push`.

   If you already ran `001` on an existing project, run only `002`. **Run it before starting this version of the app.** The app reads `users.password_changed_at` on every authenticated request, so logged-in pages return errors until the column exists. It fails if two password users already share an email (case-insensitively), but no such rows exist before this feature.
3. From **Project Settings → API**, copy:
   - the **Project URL**
   - the **service_role** key (keep this secret)

RLS is enabled with no policies, so the tables are reachable only with the service role key, which only this app's server uses.

### 3. Register the Microsoft Entra ID app

1. In the [Entra admin center](https://entra.microsoft.com), go to **App registrations → New registration**.
   - **Supported account types:** choose what you need. Single-tenant uses your tenant ID. Multi-tenant uses `organizations` or `common` as the tenant value.
   - **Redirect URI:** platform **Web**, set to `http://localhost:3000/api/auth/microsoft/callback`.
2. Under **Certificates & secrets → New client secret**, copy the secret **Value**.
3. Under **API permissions**, confirm these delegated Microsoft Graph permissions are present: `openid`, `profile`, `email`, `User.Read`. Grant admin consent if your tenant requires it.
4. From **Overview**, copy the **Application (client) ID** and **Directory (tenant) ID**.

### 4. Set up email (optional)

Password reset links are sent with [Resend](https://resend.com).

1. Create a Resend account.
2. Under **API Keys**, create a key and set it as `RESEND_API_KEY`.
3. Set `EMAIL_FROM`, or leave it empty to use Resend's test sender `onboarding@resend.dev`.
   - **The test sender only delivers to the email address of the Resend account owner.** To send to anyone else, verify a domain under **Domains** and use an address on it, e.g. `EMAIL_FROM="Mock Login App <no-reply@yourdomain.com>"`.

**Without Resend:** if `RESEND_API_KEY` is empty, no email is sent. Instead the reset link is printed to the server console (the terminal running `npm run dev`), labeled `[DEV ONLY]`. You can test the whole flow this way without an email service.

### 5. Configure the environment

```bash
cp .env.example .env.local
```

Fill in every value (`RESEND_API_KEY` and `EMAIL_FROM` are optional). To generate the JWT secret, run:

```bash
openssl rand -base64 48
```

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `JWT_SECRET` | Session signing secret, at least 32 characters |
| `AZURE_AD_TENANT_ID` | Tenant ID, or `common` / `organizations` |
| `AZURE_AD_CLIENT_ID` | Application (client) ID |
| `AZURE_AD_CLIENT_SECRET` | Client secret value |
| `APP_URL` | Base URL, e.g. `http://localhost:3000`. The Microsoft redirect URI is `${APP_URL}/api/auth/microsoft/callback`. Reset links point to `${APP_URL}/reset-password`. |
| `RESEND_API_KEY` | Optional. Resend API key. If empty, reset links are logged to the console. |
| `EMAIL_FROM` | Optional. Sender address. Defaults to `onboarding@resend.dev`. |

No variable is prefixed with `NEXT_PUBLIC_`, so none is exposed to the browser.

### 6. Run

```bash
npm run dev     # http://localhost:3000
npm run lint    # ESLint CLI with flat config (eslint.config.mjs)
npm run build && npm start   # production
```

## How it works

- **Sign up** (`/signup`):
  - Validates the username (3–30 characters, letters, digits and `_`, unique case-insensitively) and the password (at least 8 characters).
  - Stores a bcrypt hash and creates the user with `profile_completed = false`.
  - Redirects to `/login?signup=success`. It does not log the user in.
- **Password login:**
  - Verifies the bcrypt hash and updates `last_login_at`.
  - Sets the session cookie.
  - Any failure shows "Invalid username or password".
- **Microsoft login:**
  1. `/api/auth/microsoft/login` creates a PKCE verifier/challenge and a `state` value. It stores both in a signed, 10‑minute httpOnly cookie, then redirects to the URL from `getAuthCodeUrl`.
  2. `/api/auth/microsoft/callback` checks `state`, then calls `acquireTokenByCode` with the verifier.
  3. It reads `oid`, `name` and `preferred_username`/`email` from the token. It also calls Graph `/me` for `givenName`/`surname` so names can be pre-filled on onboarding.
  4. It finds the user by `microsoft_oid`, or creates one with `profile_completed = false`.
- **Onboarding** (`/onboarding`):
  - Required fields are first name, last name, company and role.
  - Password users also enter a recovery **email** (stored lowercase, unique among password users). Microsoft users don't see this field; their email comes from Microsoft.
  - Password users who onboarded before this field existed see a banner on their dashboard linking to `/account/email`, where they can add one.
  - On save, it sets `profile_completed = true`, re-issues the session cookie with the role, and redirects to the role's dashboard.
- **Forgot password** (`/login` → "Forgot password?" → `/forgot-password`):
  1. The user enters a username or email. Only **password** users are looked up.
  2. If a match has an email, the app creates a random token (32 bytes, base64url). It stores only the token's SHA-256 hash, with a 30-minute expiry, and marks the user's older unused tokens as used.
  3. It emails `${APP_URL}/reset-password?token=…`. The email is sent after the response, so response time doesn't reveal a match.
  4. The page always shows the same message, whether or not an account was found, and for Microsoft users too.
- **Reset password** (`/reset-password?token=…`):
  - The page checks that the token exists, is unused and hasn't expired. Otherwise it shows "This link is invalid or has expired".
  - On submit, the token is atomically marked used (so it can only be redeemed once). The new password is bcrypt-hashed and `password_changed_at` is set. The user is redirected to `/login?reset=success`.
  - **Old sessions stop working:** `getCurrentUser` / `requireUser` reject a session whose JWT `iat` is before `password_changed_at`. The comparison is in whole seconds, the precision of `iat`. A stale session is sent to `/api/auth/logout`, which clears the cookie.
- **Microsoft users** reset their password with Microsoft. The login page links to the personal-account and work/school reset pages.
- **Route protection** ([`proxy.ts`](proxy.ts), the Next.js 16 replacement for `middleware.ts`): verifies the JWT and handles these cases:

  | Situation | Redirect to |
  | --- | --- |
  | Not logged in | `/login` |
  | Profile incomplete | `/onboarding` |
  | Wrong role's dashboard | Your own dashboard |
  | Logged in and visiting `/login` or `/signup` | Your home page |

  `/forgot-password` and `/reset-password` are public. `/account/email` requires login and a completed profile.

  Every dashboard page and admin data function also calls `requireRole()` ([`lib/auth.ts`](lib/auth.ts), [`lib/admin.ts`](lib/admin.ts)). That check re-reads the user's role from the database, so it does not rely on the proxy or on the JWT alone.

## Adding a role

1. Add an entry to [`lib/roles.ts`](lib/roles.ts), for example `manager: { label: 'Manager', dashboard: '/dashboard/manager' }`.
2. Create `app/dashboard/manager/page.tsx` that calls `requireRole('manager')`.
3. Add a migration that extends the `users.role` check constraint to include the new value.

The proxy, onboarding options, redirects and validation all read from `lib/roles.ts`.

## Security notes

- **Role self-selection is mock-only.** Users choose their own role during onboarding (see the comment in `app/onboarding/actions.ts`). A real app must assign roles server-side, for example through admin approval or Entra ID app roles/groups.
- **No rate limiting.** It is not implemented. `TODO` comments mark where it belongs: the signup, login, forgot-password and reset-password actions, and the Microsoft login route. Without it, `/forgot-password` can be used to send many emails to a known user.
- **Reset tokens.** Only SHA-256 hashes are stored. Tokens are single-use, expire after 30 minutes, and are invalidated when a newer one is issued. The reset page sets `Referrer-Policy: no-referrer` so the token in the URL isn't leaked to other sites.
- **`password_hash` stays on the server.** It is never selected for, or returned to, the client. Selects use an explicit column list (`PUBLIC_USER_COLUMNS`).
- **Cookie `secure` flag.** The session cookie is `secure` when `NODE_ENV=production`. In development it is not, because Safari rejects `Secure` cookies on `http://localhost`.
- **Login timing.** A failed login on an unknown username still runs a bcrypt comparison, so response timing doesn't reveal which usernames exist.
