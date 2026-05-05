# BookingCart

Flight, hotel, and events booking platform built on **Next.js 15** (App Router, Turbopack), **tRPC v11**, **better-auth**, **Drizzle ORM**, and **PostgreSQL**.

## Requirements

- **Node.js ≥ 20**
- **pnpm** (`npm i -g pnpm`)
- **PostgreSQL** (local: [Postgres.app](https://postgresapp.com) recommended)

## Local setup

### 1. Clone and install

```bash
git clone <repo-url>
cd Booking-cart
pnpm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string, e.g. `postgresql://user@localhost:5432/bookingcart` |
| `BETTER_AUTH_SECRET` | ✅ | 32-byte secret — run `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | ✅ | App base URL, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Same as above, exposed to the browser |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key (`sk_test_…` or `sk_live_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key (`pk_test_…`) |
| `DUFFEL_API_KEY` | ✅ | Duffel flights API key |
| `EVENTBRITE_TOKEN` | optional | Events search via Eventbrite |
| `TICKETMASTER_API_KEY` | optional | Events search via Ticketmaster |
| `R2_ACCOUNT_ID` | optional | Cloudflare R2 — ticket PDF storage |
| `R2_ACCESS_KEY_ID` | optional | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | optional | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | optional | R2 bucket name (default: `bookingcart-tickets`) |
| `R2_PUBLIC_URL` | optional | Custom domain for R2 bucket (no trailing slash) |

### 3. Database

Create the database then run migrations:

```bash
# Create the database (if it doesn't exist yet)
createdb bookingcart

# Apply migrations
pnpm db:migrate
```

To promote a user to admin after signing up:

```bash
pnpm make-admin <email>
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm db:generate` | Generate a new Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations to the database |
| `pnpm db:push` | Push schema directly (no migration file, dev only) |
| `pnpm db:studio` | Open Drizzle Studio database browser |
| `pnpm make-admin <email>` | Promote a user to admin role |

## Project structure

```
src/
  app/          # Next.js App Router pages and API routes
  components/   # Shared UI components
  context/      # React context providers
  db/           # Drizzle schema and client
  hooks/        # Custom React hooks
  lib/          # Auth, tRPC, utilities
  server/api/   # tRPC routers
  views/        # Page-level view components
drizzle/        # Migration SQL files
scripts/        # One-off admin scripts
```

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| API | tRPC v11 + React Query v5 |
| Auth | better-auth v1 (email/password + Google OAuth) |
| Database | PostgreSQL + Drizzle ORM |
| Payments | Stripe |
| Flights | Duffel API |
| Events | Eventbrite + Ticketmaster |
| Storage | Cloudflare R2 |
| Styling | Tailwind CSS v3 + Radix UI + shadcn/ui |

## Deployment

Set all required environment variables in your host (Vercel, Render, etc.) and run:

```bash
pnpm build
```

`DATABASE_URL` must point to a reachable PostgreSQL instance. Run `pnpm db:migrate` as part of your deploy pipeline (or as a release command) to apply any pending migrations automatically.
