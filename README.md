# Revenue Autopilot

Production-grade SaaS for reducing no-shows and autofilling cancellations.

**Stack:** Turborepo · Next.js 14 · Prisma · PostgreSQL · Clerk · Tailwind · shadcn/ui

## Quick Start (10 min)

### Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL
- [Clerk](https://clerk.com) account (free tier works)

### 1. Install

```bash
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your Clerk keys and DATABASE_URL
```

Copy `.env` to `packages/lib/` as well (Prisma reads from there):

```bash
cp .env packages/lib/.env
```

### 3. Database

```bash
pnpm db:generate
pnpm db:push
```

### 4. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## What's Included (Web App MVP)

| Feature | Status |
|---------|--------|
| Landing page (Hebrew RTL) | ✅ |
| ROI calculator | ✅ |
| Clerk auth + org onboarding | ✅ |
| Dashboard (metrics, appointments) | ✅ |
| Google Calendar OAuth + token refresh | ✅ |
| Demo data fallback (no calendar) | ✅ |
| Messaging engine (SMS via Twilio) | ✅ |
| Twilio delivery status webhook | ✅ |
| BullMQ scheduler (reminders + calendar sync) | ✅ |
| Stripe billing (checkout + webhooks) | ✅ |
| 14-day trial + subscription gating | ✅ |
| JWT action links (confirm/cancel/claim) | ✅ |
| Autofill with atomic slot claim | ✅ |
| Message deduplication | ✅ |
| Audit logs | ✅ |
| Settings page | ✅ |

## Project Structure

```
apps/
  web/          Next.js SaaS (landing + app)
packages/
  lib/          Prisma schema, shared utils, claim/dedupe logic
  ui/           Shared shadcn/ui components
```

## Messaging (Twilio SMS)

### Dev mode (default)
```env
MESSAGING_MODE=dev
```
Messages log to server console — no Twilio account needed.

### Production SMS
```env
MESSAGING_MODE=production
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...   # Your Twilio number
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

1. Configure Twilio status callback URL: `https://your-domain.com/api/webhooks/twilio/status`
2. Go to **Settings → SMS** in the app and send a test message
3. WhatsApp is opt-in only: set `MESSAGING_ENABLE_WHATSAPP=true` when ready

## Background Jobs (BullMQ)

Autopilot requires Redis + a worker process:

```bash
# Terminal 1 — web app
pnpm dev

# Terminal 2 — job worker
pnpm worker
```

```env
REDIS_URL=redis://localhost:6379
```

### What runs automatically
| Job | Schedule |
|-----|----------|
| Reminder 24h | 24h before appointment |
| Reminder 3h | 3h before appointment |
| Calendar sync | Every 10 minutes |
| Quiet hours | Delays send until morning |

Jobs are scheduled when autopilot activates, calendar syncs, or appointments are claimed.
Check status: `GET /api/jobs/status`

## Google Calendar (OAuth + Token Refresh)

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

- Access tokens refresh automatically **5 minutes before expiry**
- On `401` from Google API → force refresh + retry once
- On `invalid_grant` → integration marked inactive, user prompted to reconnect
- Status: `GET /api/integrations/google-calendar/connect`

## Stripe Billing

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
```

1. Create Products + recurring Prices in Stripe Dashboard (ILS)
2. Webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
4. Manage plans at `/dashboard/billing`

**Trial:** 14 days from org creation (`TRIALING`). After expiry, messaging/autopilot pauses until upgrade.

## Dev Mode (No External Services)

Without Twilio/Resend/Google configured, the app still works:

- Messages log to console (`[DEV SMS]`, `[DEV EMAIL]`)
- Calendar sync creates demo appointments
- All core flows testable locally

## Tests

```bash
pnpm test
```

Unit tests cover: dedupe keys, channel routing, quiet hours, revenue calculation.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/onboarding` | POST | Create organization |
| `/api/onboarding/activate` | POST | Enable autopilot |
| `/api/calendar/sync` | POST | Sync Google Calendar or demo data |
| `/api/messages/send` | POST | Send confirmation/reminder |
| `/api/health` | GET | Health check |
| `/actions/confirm?token=` | GET | Customer confirms appointment |
| `/actions/cancel?token=` | GET | Customer cancels → triggers autofill |
| `/actions/claim?token=` | GET | Waitlist customer claims slot |

## Deployment

- **Web:** Vercel (set all env vars)
- **DB:** Neon, Supabase, or Railway PostgreSQL
- **Redis:** Upstash (for future BullMQ job scheduler)

## Next Steps

- [ ] Chrome Extension (MV3)
- [ ] BullMQ reminder scheduler (24h, 3h)
- [ ] Stripe billing webhooks
- [ ] Sentry monitoring

## License

Private — All rights reserved.
