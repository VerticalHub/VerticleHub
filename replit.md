# HealthLead Pro

Healthcare lead generation, resale marketplace, and AI demand intelligence platform with a dark terminal UI.

## Architecture

- **Frontend**: React + Vite, TanStack Query, Wouter routing, Tailwind CSS + shadcn/ui, Recharts
- **Backend**: Express.js + TypeScript, Drizzle ORM, PostgreSQL
- **Auth**: express-session + bcryptjs, sessions stored in PostgreSQL via connect-pg-simple
- **Scheduling**: node-cron (lead aging decay every 15 min)
- **Font**: JetBrains Mono (Google Fonts)

## Color Palette (Dark Terminal UI)

- bg: `#070d1a`, card: `#0d1526`, border: `#1e2d4a`, text: `#c8daf0`
- green: `#00d084`, red: `#ff4d4d`, blue: `#38bdf8`, amber: `#fbbf24`, purple: `#a78bfa`

## Demo Credentials

- Admin: `admin` / `admin123`
- Agent: `agent1` / `agent123`

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Sign in / register |
| `/dashboard` | Dashboard | Post-login landing — KPI overview, pipeline charts, alerts, quick actions |
| `/leads` | Leads | Pipeline funnel, analytics, CRM activity log, lead capture link |
| `/home` | Home | TCPA-compliant lead intake form |
| `/marketplace` | Marketplace | Order book, watchlist, portfolio, AI signals |
| `/admin` | Admin | Command center — overview, lead DB, listings, market data, users |
| `/thank-you` | ThankYou | Post-submission confirmation |

## Key Features

1. **Dashboard** — Comprehensive post-login overview: 6 KPI cards, status distribution bar chart, source pie chart, recent captures feed, market signals, alert panel, quick action buttons
2. **Session-based authentication** — Login/register, auth guard on all routes, role badge (admin=red, agent=green, viewer=amber) in header user chip
3. **Header** — Live ticker tape (12 markets, animated), bell notifications (real-time polling), mobile hamburger nav, DASHBOARD/LEADS/MARKETPLACE/COMMAND CENTER links, Cmd+K shortcut
4. **Command Palette** — Cmd+K opens searchable palette with nav items, quick actions, and dynamic lead search (type 2+ chars)
5. **Lead DB** — Full-text search, state/status/TCPA/DNC filters, inline status edit (click badge), row expansion with full profile, bulk select + bulk DNC, CSV export
6. **Marketplace Order Book** — Watchlist heart toggle, value score column (quality÷price×10), BEST VALUE/FEATURED/PRIME badges, sort by featured/quality/value/price, buy flow with credit check
7. **Watchlist Tab** — Saved listings with full details, remove buttons, price alerts creation form, active alerts list
8. **Portfolio Tab** — Purchase history, credit packages for top-up, spend/balance stats
9. **AI Signals Tab** — Demand prediction grid, market health radar chart, value score distribution chart
10. **TCPA compliance flags** — `tcpaConsent`, `tcpaConsentSource` tracked per lead
11. **Purchase deduplication** — Server-side 409 on re-purchase, UI shows "OWNED" state
12. **Lead aging/decay** — `agingScore` computed every 15 min via cron (2% decay/hr, floor 30)
13. **Alerts system** — Auto-generated on purchase, conversion, new prime lead, low balance, DNC; bell polls every 30s; mark read / mark all read
14. **CSV export** — `/api/export/leads` and `/api/export/listings` with optional filters
15. **CRM layer** — Activities table (call/email/note), disposition tracking, follow-up scheduling
16. **AI Demand Predictions** — Predict + generate endpoints, confidence scores, factor breakdown
17. **Market Trends** — Time-series volume + avgPrice data with LineChart visualization
18. **User Management** — Admin tab shows all users with role colors

## API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register  
- `GET /api/auth/me` — Current session
- `POST /api/auth/logout` — Logout

### Leads (order matters — stats/search BEFORE /:id)
- `GET /api/leads/stats` — Aggregate stats (byStatus, byState, bySource, counts)
- `GET /api/leads/search?q=&state=&status=&tcpa=&dnc=` — Full-text search
- `POST /api/leads` — Capture new lead (TCPA validated)
- `GET /api/leads` — All leads
- `GET /api/leads/:id` — Single lead
- `PATCH /api/leads/:id` — Update status/notes/tags
- `POST /api/leads/:id/dnc` — Mark DNC
- `POST /api/leads/bulk-dnc` — Bulk DNC `{ leadIds: number[] }`

### Marketplace
- `GET /api/lead-listings` — Active listings (with filters)
- `GET /api/lead-listings/all` — All listings
- `POST /api/lead-listings` — Create listing
- `POST /api/lead-listings/:id/purchase` — Buy lead

### Watchlist & Alerts
- `GET/POST /api/watchlist` — Get / toggle watchlist
- `DELETE /api/watchlist/:listingId` — Remove
- `GET/POST /api/price-alerts` — Get / create price alerts
- `DELETE /api/price-alerts/:id` — Delete alert

### Dashboard
- `GET /api/dashboard?userId=1` — Aggregated summary

### Credits
- `GET /api/credits/:userId` — Account balance
- `GET /api/credit-packages` — Available packages
- `POST /api/credits/purchase` — Deposit

### Intelligence
- `GET /api/demand-predictions` — AI demand forecasts
- `POST /api/demand-predictions/generate` — Generate new prediction
- `GET /api/market-trends` — Market trend time series

### Export
- `GET /api/export/leads?state=&status=` — CSV export
- `GET /api/export/listings` — Listings CSV

## Database Schema (shared/schema.ts)

Tables: `users`, `leads`, `leadListings`, `leadPurchases`, `creditAccounts`, `creditTransactions`, `creditPackages`, `alerts`, `leadActivities`, `demandPredictions`, `marketTrends`, `watchlist`, `priceAlerts`

Key lead fields: `status`, `source`, `tcpaConsent`, `tcpaConsentSource`, `dnc`, `agingScore`, `leadScore`, `notes`, `tags`, `annualIncome`, `householdSize`

## CSS Classes (index.css)

- `.badge-{status}` — Status badges (new/contacted/qualified/converted/archived)
- `.badge-best-value` — Green gradient "BEST VALUE" badge
- `.badge-featured` — Purple "FEATURED" badge
- `.glow-{green|blue|red|amber|purple}` — Static box-shadow glow
- `.pulse-{green|blue|red|amber}` — Animated pulsing glow
- `.shimmer` — Loading skeleton animation
- `.pipeline-bar` — Animated width bar for funnel visualization
- `.ticker-track` — Auto-scrolling ticker animation
- `.fade-in` — Entrance animation
- `.slide-down` — Collapsible row animation
- `.num` — Tabular number alignment
