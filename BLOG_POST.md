# Multi-Tenant Authentication with Supabase: A Production Implementation

## The Problem

You're building a multi-tenant SaaS where each of your customers (tenants) has their own end-users. The challenge:

**Supabase Auth enforces global email uniqueness** - one email = one account across your entire platform.

But you need:

- ✅ `john@company.com` can have separate accounts on Tenant A and Tenant B
- ✅ Each account has its own password
- ✅ Complete isolation - logging into Tenant A has nothing to do with Tenant B

**Real-world example:** You're building a B2B platform. Agency A and Agency B both serve the same client `acme-corp.com`. When `sarah@acme-corp.com` tries to sign up with both agencies, it fails - the email already exists.

## Why Not Just Use Auth0/Clerk/etc?

There are great managed solutions (Auth0, Clerk, WorkOS, Kinde) with native multi-tenant support. This guide is specifically for teams that:

- Already use Supabase and want to add multi-tenancy
- Want the full Supabase ecosystem (database + auth + storage + realtime)
- Value open-source and want to avoid vendor lock-in
- Want full control over the implementation

## The Solution: Internal Email Mapping

The core idea is simple: **users see their real email, but Supabase stores a unique internal email per tenant**.

### How It Works

1. User signs up as `john@company.com` on Tenant A
2. Backend generates internal email: `abc123...@customers.internal` (SHA256 hash)
3. Supabase creates user with the internal email
4. Database stores the mapping: `(TenantA, john@company.com, abc123@customers.internal)`
5. Webhook intercepts auth emails and sends them to the real address

**Result:** Same user can sign up on Tenant B with a completely different password. Supabase sees two different users, your database maintains the connection to real identities.

## The Stack

This demo implementation uses:

**Frontend:**

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4

**Backend:**

- NestJS (TypeScript)
- Supabase Auth (for authentication)
- PostgreSQL (Supabase database)
- Prisma v7 (ORM with adapter pattern)
- Resend (email delivery)

**Deployment:**

- Frontend: Vercel
- Backend: Fly.io
- Database: Supabase (includes PostgreSQL)

## Critical Implementation Details

### 1. SHA256 Internal Email Generation

**Backend generates unique internal emails per tenant:**

```typescript
// backend/src/auth/auth.service.ts
private generateInternalEmail(realEmail: string, tenantId: string): string {
  const combined = `${realEmail.toLowerCase().trim()}:${tenantId}`;
  const hash = createHash('sha256').update(combined).digest('hex');
  return `${hash}@customers.internal`;
}
```

**Why this works:**

- SHA256 is deterministic (same inputs = same output)
- Collision-resistant (virtually impossible to duplicate)
- Same real email + different tenant = different hash
- One-way (can't reverse-engineer the real email)

### 2. Database Mapping

**Store the connection between real and internal emails:**

```prisma
model customer_auth_mappings {
  id             String   @id @default(uuid())
  tenant_id      String
  user_id        String
  real_email     String
  internal_email String
  email_verified Boolean  @default(false)

  @@unique([tenant_id, real_email])  // One email per tenant
  @@index([internal_email])          // Fast auth lookups
}
```

**Example data:**
| tenant_id | real_email | internal_email |
|-----------|------------|----------------|
| tenant-a | john@example.com | abc123@customers.internal |
| tenant-b | john@example.com | def456@customers.internal |

Same real email, different internal emails = perfect isolation.

### 3. Webhook Email Interception

**Supabase tries to send emails to internal addresses - intercept and redirect:**

```typescript
// backend/src/webhooks/webhooks.controller.ts
@Post('supabase')
async handle(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
  // CRITICAL: Respond immediately (Supabase webhooks timeout after 5 seconds)
  res.status(200).json({ received: true });

  // Process asynchronously
  const event = verifyWebhook(req.rawBody, req.headers);

  if (event.email_data?.email_action_type === 'magiclink') {
    const realEmail = event.user.user_metadata.real_email;
    await this.emailService.sendOtp(realEmail, event.email_data.token);
  }
}
```

**Why webhooks:**

- Users receive emails at their real address (not `abc123@customers.internal`)
- You control email templates and branding
- Can add custom logic (rate limiting, etc.)

### 4. Signup Flow (Backend)

**Create user in Supabase + database mapping in one transaction:**

```typescript
// backend/src/auth/auth.service.ts
async signUp(tenantSlug: string, realEmail: string, password: string) {
  const tenant = await this.prisma.tenants.findUnique({ where: { slug: tenantSlug } });
  const internalEmail = this.generateInternalEmail(realEmail, tenant.id);

  // Create in Supabase
  const { data } = await this.supabaseAdmin.auth.admin.createUser({
    email: internalEmail,
    password,
    user_metadata: { real_email: realEmail, tenant_id: tenant.id }
  });

  // Create mapping in database
  await this.prisma.customer_auth_mappings.create({
    data: {
      tenant_id: tenant.id,
      user_id: data.user.id,
      real_email: realEmail,
      internal_email: internalEmail
    }
  });

  return { success: true };
}
```

**Key decision:** Database mapping is created in the signup endpoint (not via webhook) for reliability. Webhooks are only used for email interception.

## Get the Code

Production-ready starter repository with full implementation:

**Repository:** [github.com/KristianRykkje/Supabase-multi-tenancy-auth](https://github.com/KristianRykkje/Supabase-multi-tenancy-auth)

Includes:

- Full TypeScript implementation (NestJS + Next.js 16)
- Prisma schema with migrations
- Email templates (Resend)
- Docker setup for local development
- Deployment guides (Vercel + Fly.io)

```bash
# Quick Start
git clone https://github.com/KristianRykkje/Supabase-multi-tenancy-auth
cd supabase-multitenant-auth-starter
pnpm install
cp .env.example .env  # Fill in your Supabase credentials
cd backend && npx prisma migrate dev
cd .. && pnpm dev  # Open http://localhost:3000
```

## Conclusion

If you're building a B2B SaaS where your customers need their own isolated user bases, you no longer need to abandon Supabase or compromise on multi-tenancy.

**The core problem** - Supabase's global email uniqueness preventing the same email from signing up across different tenants - has a **production-ready solution** using internal email mapping.

**Key takeaways:**

1. **Same email, different tenants** - Users can have independent accounts across your customers with different passwords
2. **Stay in the Supabase ecosystem** - Keep all the benefits of Supabase (database, auth, storage, realtime) while adding true multi-tenancy
3. **Production-proven** - This approach has been tested in real-world production environments with actual users
4. **Simple implementation** - Four critical pieces: SHA256 hashing, database mapping, webhooks, and proper signup flow
5. **Cost-effective** - $25/month for 100K users vs $2,400+/month with Auth0

## Resources

- **Starter Repository:** [github.com/KristianRykkje/Supabase-multi-tenancy-auth](https://github.com/KristianRykkje/Supabase-multi-tenancy-auth)
- **Live Demo:** [mta.tsukareta.xyz](https://mta.tsukareta.xyz)
- **Supabase Docs:** [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
- **NestJS Docs:** [nestjs.com/docs](https://nestjs.com/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Docs:** [prisma.io/docs](https://www.prisma.io/docs)
- **Resend Docs:** [resend.com/docs](https://resend.com/docs)

## About the Author

I've been running Supabase meetups for years and building production applications with Supabase at scale. This architecture emerged from real-world needs in building multi-tenant SaaS applications.

---

_Found this helpful? Star the [GitHub repo](https://github.com/KristianRykkje/Supabase-multi-tenancy-auth) and share with your team!_
