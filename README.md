# SaaS Base

A production-ready SaaS boilerplate with authentication, multi-tenancy, billing, and internationalisation built on Next.js 16, tRPC, Prisma, Supabase, and Stripe.

## Supabase + Vercel: Two Database URLs

When deploying to Vercel (serverless), Prisma must use Supabase's **pooler connection** at runtime to avoid exhausting the connection pool. Migrations need the **direct URL** to bypass pgBouncer.

| Variable | URL type | Port | When it's used |
| --- | --- | --- | --- |
| `DATABASE_URL` | Pooler (`*.pooler.supabase.com`) | 6543 | Every runtime query |
| `DIRECT_URL` | Direct (`db.*.supabase.co`) | 5432 | `prisma migrate` / `prisma db push` |

Both URLs come from your Supabase dashboard → **Project Settings → Database → Connection string**.

---

## Prerequisites

- **Node.js** 20+ (check with `node -v`)
- **Supabase** account — [supabase.com](https://supabase.com) (free tier available)
- **Stripe** account — [dashboard.stripe.com](https://dashboard.stripe.com)

---

## Local Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd saas-base

# 2. Install dependencies
npm install

# 3. Copy the example environment file
cp .env.example .env.local

# 4. Fill in all values in .env.local (see sections below for each service)

# 5. Generate the Prisma client
npm run db:generate

# 6. Run the database migration
npm run db:migrate

# 7. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Configuring Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Go to **Project Settings → API**:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **Project Settings → Database → Connection string**:
   - Copy the **Transaction pooler** string (port 6543) → `DATABASE_URL`
   - Copy the **Session pooler** or **Direct** string (port 5432) → `DIRECT_URL`

### Email Auth

Supabase Email Auth is enabled by default. For production, configure a custom SMTP provider in **Project Settings → Auth → SMTP Settings** to avoid hitting Supabase's email rate limits.

The sign-up flow sends a confirmation email. After the user clicks the link, they are redirected to `/auth/callback` (handled by `src/app/auth/callback/route.ts`), which exchanges the code for a session.

---

## Configuring Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com).
2. Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy **Secret key** → `STRIPE_SECRET_KEY`

### Create Products

Create two recurring subscription products in **Stripe Dashboard → Products → Add product**:

| Product  | Price   | Billing |
| -------- | ------- | ------- |
| Pro      | $29 /mo | Monthly |
| Business | $79 /mo | Monthly |

For each product, copy the **Price ID** (starts with `price_`):

- Pro price ID → `STRIPE_PRICE_PRO_USD`
- Business price ID → `STRIPE_PRICE_BUSINESS_USD`

### Set Up Webhooks

In **Stripe Dashboard → Developers → Webhooks → Add endpoint**:

- Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
- Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

For local testing with the Stripe CLI:

```bash
# Install Stripe CLI, then:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## How to Add a New Plan

1. **`prisma/schema.prisma`** — add the new value to the `Plan` enum:

   ```prisma
   enum Plan {
     FREE
     PRO
     BUSINESS
     ENTERPRISE  # new
   }
   ```

   Then run `npm run db:migrate`.

2. **`src/domains/plans/plans.gates.ts`** — add entitlements to `GATES`:

   ```ts
   ENTERPRISE: {
     projects:  999,
     members:   999,
     canExport: true,
     canUseApi: true,
   }
   ```

3. **`src/domains/plans/plans.config.ts`** — add presentation data to `PLAN_CONFIG`:

   ```ts
   ENTERPRISE: {
     nameKey:       'plans.enterprise.name',
     descriptionKey:'plans.enterprise.description',
     price:         { usd: 199 },
     priceIdEnvKey: 'STRIPE_PRICE_ENTERPRISE_USD',
     featureKeys:   ['plans.enterprise.feature1'],
   }
   ```

4. **`.env.example`** and **`.env.local`** — add the new price ID env var:

   ```bash
   STRIPE_PRICE_ENTERPRISE_USD=price_...
   ```

5. **`src/lib/env.ts`** — add validation for the new env var.

6. **`src/messages/*.json`** — add translation keys for the new plan in all locale files.

---

## How to Add a New Permission Gate

1. **`src/domains/plans/plans.gates.ts`** — add the new action to `GateAction` and `Gates`:

   ```ts
   export type GateAction = 'projects' | 'members' | 'canExport' | 'canUseApi' | 'canDoNewThing'

   export type Gates = {
     // ...existing fields
     canDoNewThing: boolean
   }
   ```

   Then add the value to each plan in the `GATES` object.

2. **Use in a tRPC procedure** with `assertCan`:

   ```ts
   await assertCan(userId, 'canDoNewThing')
   ```

3. **Use in a Server Component** with the `Gate` component:

   ```tsx
   <Gate userId={userId} action="canDoNewThing">
     <FeatureContent />
   </Gate>
   ```

---

## How to Add a New Locale

1. Create `src/messages/{locale}.json` with all translation keys (copy `en.json` as a starting point).

2. Register the locale in `src/lib/i18n/config.ts`:

   ```ts
   export const routing = defineRouting({
     locales: ['en', 'pt', 'es', 'fr'],  // add new locale
     defaultLocale: 'en',
   })
   ```

That's it — next-intl handles routing and message loading automatically.

---

## Where to Plug In Email Sending

Search the codebase for `TODO: send invite email`. You will find it in `src/domains/invites/invites.service.ts`. Replace the `console.log` with your email provider:

```ts
// TODO: send invite email via Resend — for now log the invite URL
console.log(`[INVITE] ${env.NEXT_PUBLIC_APP_URL}/invite/${token}`)
```

Recommended: [Resend](https://resend.com) — install `resend`, create a `lib/resend.ts` singleton, and call `resend.emails.send(...)` with the invite URL.

---

## Inspecting the Database

```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555` — a visual browser for your database tables.

---

## Available Scripts

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Start development server           |
| `npm run build`       | Build for production               |
| `npm run start`       | Start production server            |
| `npm run lint`        | Run ESLint                         |
| `npm run db:generate` | Regenerate Prisma client           |
| `npm run db:migrate`  | Run pending Prisma migrations      |
| `npm run db:push`     | Push schema changes (no migration) |
| `npm run db:studio`   | Open Prisma Studio                 |

---

## Architecture

```text
src/
├── app/                    Next.js App Router (pages + API routes)
│   ├── auth/callback/      Supabase PKCE auth callback (email confirm / OAuth)
│   └── api/webhooks/stripe Stripe webhook handler
├── domains/                Business logic, grouped by domain
│   ├── auth/               Supabase session helpers
│   ├── billing/            Stripe checkout and portal
│   ├── invites/            Project invite system
│   ├── members/            RBAC and membership management
│   ├── plans/              Entitlements, gates, plan config
│   ├── projects/           Project CRUD
│   └── users/              User sync and profile
├── components/
│   ├── ui/                 shadcn/ui components (do not edit)
│   ├── shared/             Reusable app components
│   └── layouts/            Page shell and navigation
├── lib/
│   ├── supabase/           Supabase clients (server, client, middleware)
│   └── ...                 Other singletons (db, stripe, trpc, i18n)
├── messages/               i18n translation files (en, pt, es)
└── proxy.ts                Next.js 16 request proxy (auth + locale + onboarding)
```
