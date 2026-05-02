# HealthLead Pro

Healthcare lead generation, resale marketplace, and AI demand intelligence platform with a dark terminal UI.

## Architecture

- **Frontend**: React + Vite, TanStack Query, Wouter routing, Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript, Drizzle ORM, PostgreSQL
- **Auth**: express-session + bcryptjs, sessions stored in PostgreSQL via connect-pg-simple
- **Scheduling**: node-cron (lead aging decay every 15 min)

## Key Features

1. **Session-based authentication** — Login/register pages, auth guard on all routes, logout in header user chip
2. **TCPA compliance flags** — `tcpaConsent`, `tcpaConsentSource`, visible in Admin Lead DB and Leads analytics table
3. **Purchase deduplication** — Checks owned lead IDs before opening buy modal; server-side blocks re-purchase with 409
4. **Lead aging/decay** — `agingScore` computed every 15 min via cron (2% decay/hr, floor 30); age indicator column in Lead DB (green/amber/red by hours old)
5. **Alerts system** — `alerts` table; auto-generated on purchase, new lead capture, low balance, DNC; live bell in header polling every 30s; mark read / mark all read
6. **CSV export** — GET `/api/export/leads` and `/api/export/listings` download full datasets
7. **CRM activity layer** — `leadActivities` table; inline activity feed in expandable Admin rows with log form (call/email/note + disposition)

## Database Tables

- `leads` — with tcpaConsent, tcpaConsentDate, tcpaConsentSource, dnc, dncAddedAt, agingScore
- `users` — with email, role (admin/agent)
- `alerts` — userId, type, title, body, leadId, read
- `leadActivities` — leadId, userId, type, disposition, notes, duration, followUpAt
- `leadListings`, `leadPurchases`, `creditAccounts`, `creditTransactions`, `creditPackages`, `demandPredictions`, `marketTrends`

## Demo Credentials

- Username: `admin` / Password: `admin123`

## Dark Palette

- Background: `#070d1a` | Card: `#0d1526` | Border: `#1e2d4a`
- Text: `#c8daf0` | Green: `#00d084` | Red: `#ff4d4d`
- Blue: `#38bdf8` | Amber: `#fbbf24` | Purple: `#a78bfa`

## API Routes

- **Auth**: `POST /api/auth/login|register|logout`, `GET /api/auth/me`
- **Leads**: `GET|POST /api/leads`, `GET /api/leads/:id`, `POST /api/leads/:id/dnc`, `GET /api/leads/:leadId/owned`
- **Activities**: `GET|POST /api/leads/:id/activities`, `GET /api/follow-ups`
- **Alerts**: `GET /api/alerts`, `GET /api/alerts/unread`, `PATCH /api/alerts/:id/read`, `PATCH /api/alerts/read-all`
- **Marketplace**: `GET /api/lead-listings`, `POST /api/lead-listings/:id/purchase`
- **Credits**: `GET /api/credits/:userId`, `POST /api/credits/purchase`, `GET /api/credit-packages`
- **Export**: `GET /api/export/leads`, `GET /api/export/listings`
- **AI**: `GET /api/demand-predictions`, `GET /api/market-trends`
