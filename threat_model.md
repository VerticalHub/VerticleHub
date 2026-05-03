# Threat Model

## Project Overview

HealthLead Pro is a full-stack healthcare lead generation and resale marketplace built with a React/Vite frontend and an Express/TypeScript backend backed by PostgreSQL via Drizzle ORM. Users authenticate with cookie-backed sessions and can capture leads, browse and purchase listings, manage watchlists and alerts, view account balances, and use administrative workflows for marketplace operations.

Production scope is the Express server in `server/index.ts`, route handlers in `server/routes.ts`, persistence logic in `server/storage.ts`, and shared request/data schemas in `shared/schema.ts`. The React client is untrusted and must not be relied on for authentication or authorization.

## Assets

- **User accounts and sessions** — usernames, password hashes, session cookies, roles, referral codes. Compromise enables impersonation and privilege escalation.
- **Lead data and regulated contact information** — names, emails, phone numbers, state, ZIP, date of birth, income, household size, consent flags, notes, DNC state, and activity history. This is sensitive business data and contains personal information.
- **Marketplace and financial records** — credit balances, credit transactions, lead purchases, listing inventory, pricing, and reseller activity. Unauthorized access or tampering directly impacts revenue and customer trust.
- **Seller submissions and internal review data** — pending submissions, admin notes, review status, and reviewed-by metadata. These must remain scoped to the submitting user or authorized admins.
- **Application secrets** — `DATABASE_URL`, `SESSION_SECRET`, and any future API keys. Secret compromise can allow account takeover or full backend compromise.

## Trust Boundaries

- **Browser to Express API** — every client request crosses this boundary. The browser is untrusted; authentication and authorization must be enforced server-side on every sensitive route.
- **Express API to PostgreSQL** — route handlers have broad read/write access to the database. Broken access control or unsafe writes at the API layer can expose or modify all stored lead and account data.
- **Public lead-capture surface to authenticated CRM/admin surfaces** — `/api/leads` creation is public-facing, while lead management, purchases, credits, alerts, exports, submissions review, and admin analytics are authenticated or privileged functions and must be isolated from public callers.
- **Authenticated user to admin boundary** — admin dashboards, user enumeration, revenue analytics, and submission review require server-side role checks; frontend routing is not a security control.
- **Production vs dev-only boundary** — Vite dev helpers, mock/demo UI behavior, and any local-only tooling should be ignored unless a production code path references them. In this repo, `server/vite.ts` is dev-only and should not be treated as production-reachable when `NODE_ENV=production`.

## Scan Anchors

- **Production entry point:** `server/index.ts`
- **Highest-risk server surface:** `server/routes.ts` and `server/storage.ts`
- **Session/auth logic:** `server/index.ts`, `server/middleware/auth.ts`, `/api/auth/*`
- **Sensitive data areas:** leads, purchases, credits, alerts, submissions, exports, admin analytics
- **Public surface:** `/api/leads` (capture), `/api/auth/login`, `/api/auth/register`
- **Authenticated/admin surfaces that must be enforced server-side:** most remaining `/api/*` routes, especially `/api/users`, `/api/admin/*`, `/api/export/*`, `/api/submissions*`, `/api/credits*`, `/api/purchases*`
- **Usually dev-only:** `server/vite.ts`, Vite runtime/development helpers, mock UI-only components

## Threat Categories

### Spoofing

The application uses cookie-backed sessions, so the server must reject forged or attacker-created sessions. Session secrets must be unique per deployment, unpredictable, and never fall back to hardcoded defaults. Login and registration flows must not create predictable privileged accounts in production.

### Tampering

Clients can submit lead updates, DNC actions, credit purchases, watchlist changes, submissions reviews, and listing purchases. The server must derive the acting user from the authenticated session, ignore caller-supplied identity fields for authorization decisions, and validate that the caller is permitted to perform the requested mutation.

### Information Disclosure

This application stores sensitive lead and account data. Lead records, submission history, alerts, transactions, purchases, and admin analytics must only be returned to authorized principals. Export endpoints must be treated as highly sensitive because they can dump entire datasets in bulk.

### Denial of Service

Public endpoints such as login, registration, and lead capture can be abused for brute-force or resource exhaustion if they lack rate limiting or abuse controls. Expensive list/export endpoints should remain inaccessible to unauthenticated users and should avoid unbounded production queries.

### Elevation of Privilege

Frontend route guards do not provide security. All admin and user-scoped routes must enforce authentication and role checks on the server. Any route that accepts `userId`, `buyerId`, or similar identifiers from query parameters, path parameters, or JSON bodies must treat those values as data only, never as proof of identity. Predictable bootstrap credentials or hardcoded session material would also let attackers escalate directly into privileged access.