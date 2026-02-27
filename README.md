# Supabase Multi-Tenant Auth Starter

Production-ready multi-tenant authentication with Supabase. **Same email, different tenants, different passwords** - true tenant isolation.

## Features

- ✅ Same email across multiple tenants with different passwords
- ✅ Two login methods: Email+Password or OTP (6-digit code)
- ✅ Backend-controlled security (frontend is untrusted)
- ✅ Webhook signature verification
- ✅ Rate limiting on all endpoints
- ✅ Email enumeration protection

## Quick Start

### 1. Prerequisites

- Node.js 22+ and pnpm
- Supabase project ([supabase.com](https://supabase.com))
- Resend account for emails ([resend.com](https://resend.com))

### 2. Set Up Supabase

1. **Create project** at [supabase.com](https://supabase.com)

2. **Get credentials** from Project Settings → API:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`

3. **Get database URL** from Project Settings → Database:
   - Connection string → URI (use Transaction pooler for `DATABASE_URL`)
   - Session pooler for `DIRECT_URL` (needed for Prisma migrations)

4. **Set up webhook** in Authentication → Hooks → Send Email Hook:
   - Enable hook
   - URL: `https://your-backend.com/webhooks/supabase` (use ngrok for local testing)
   - Generate and save secret as `SUPABASE_WEBHOOK_SECRET`
   - This intercepts Supabase emails so we send them via Resend

### 3. Install Dependencies

```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

### 4. Configure Environment Variables

**Backend** (`backend/.env`):

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
SUPABASE_WEBHOOK_SECRET=whsec_xxx

# Database (use Supabase pooled connection)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=hello@yourdomain.com

# App
FRONTEND_URL=http://localhost:3000
PORT=3001
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5. Set Up Database

```bash
cd backend

# Generate Prisma client (Prisma v7)
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed demo tenants
pnpm prisma db seed
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
pnpm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm run dev
```

### 7. Test Multi-Tenant Auth

Open http://localhost:3000 and try:

1. **Sign up** at `/tenant-a/signup` with `test@example.com`
2. **Sign up** at `/tenant-b/signup` with same email but different password
3. **Login** to both - they work independently! 🎉

## How It Works

1. User signs up with `user@example.com` on Tenant A
2. Backend validates tenant → generates internal email `sha256(email:tenant_id)@customers.internal`
3. Supabase creates user with internal email
4. Webhook fires → backend sends welcome email to real address
5. Same user can sign up on Tenant B with different password ✅

**Why backend-only email generation?**
- Frontend is untrusted - users could spoof tenant IDs
- Backend validates everything before processing
- Impossible to bypass tenant isolation

## Authentication Flows

### Password Login
- Traditional email + password authentication

### OTP Login (Passwordless)
- Request 6-digit code via email
- Enter code to sign in
- No password needed

**Note:** No password reset - users can use OTP login if they forget their password.

## Project Structure

```
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── auth/              # Auth service & controller
│   │   ├── webhooks/          # Supabase webhook handlers
│   │   ├── email/             # Resend email service
│   │   └── prisma/            # Database service
│   ├── prisma/
│   │   ├── schema.prisma      # 3 tables: tenants, users, mappings
│   │   └── seed.ts            # Demo tenant data
│   └── prisma.config.ts       # Prisma v7 config
│
├── frontend/                   # Next.js 15 (App Router)
│   ├── app/[tenant]/          # Dynamic tenant routing
│   │   ├── signup/
│   │   ├── login/
│   │   └── dashboard/
│   └── lib/auth-client.ts     # Secure API client
```

## Database Schema

### 3 Tables

**tenants** - Tenant information (name, slug)

**users** - Links to Supabase user IDs

**customer_auth_mappings** - The magic! Maps real emails to internal emails per tenant

```sql
-- Example: Same email, different tenants
tenant_id  | real_email         | internal_email
-----------+--------------------+--------------------------------
tenant-a   | user@example.com   | 7a8b9c...@customers.internal
tenant-b   | user@example.com   | 9f8e7d...@customers.internal
```

Unique constraint: `[tenant_id, real_email]` = true isolation ✅

## Deployment

### Backend
Deploy to Railway, Render, or any Node.js host. Set all environment variables from `.env.example`.

After deploying, update Supabase Auth Hook URL to your production backend.

### Frontend
Deploy to Vercel (recommended), Netlify, or Cloudflare Pages.

Set environment variables:
- `NEXT_PUBLIC_API_URL` → Your backend URL

### Database
Use Supabase's built-in Postgres (recommended) or Neon.tech.

## Troubleshooting

**Emails not sending?**
- Check Resend API key
- Verify Auth Hook is enabled in Supabase
- Check backend logs for `[Webhook] Received request`
- Use ngrok for local webhook testing: `ngrok http 3001`

**"Invalid tenant" error?**
- Run `pnpm prisma db seed` to create demo tenants

**Build errors?**
- Make sure you're using Node.js 22+
- Run `pnpm prisma generate` in backend

## Important Notes

### Prisma v7
This project uses Prisma v7 with the new configuration:
- Import from generated path: `from "../../generated/prisma/client"`
- `prisma.config.ts` at project root (excluded from Docker)
- Use `DIRECT_URL` for migrations, `DATABASE_URL` for runtime

### Webhook Verification
- Uses `standardwebhooks` package (required by Supabase)
- Responds immediately (< 5 seconds) to prevent timeout
- Processes emails asynchronously in background

## Cost (100K users/month)

- Supabase Pro: $25
- Resend: $20
- Backend hosting: $20
- Frontend hosting: $0 (Vercel free tier)

**Total: ~$65/month** (vs $2,400 for Auth0!)

## License

MIT - use freely in your projects!

---

Built with Supabase, NestJS, and Next.js
