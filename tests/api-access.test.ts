// Access-control tests for the API. Storage and the database are replaced with an
// in-memory fake, so these run without Postgres: `npm test`.
import { describe, it, expect, beforeAll, vi } from "vitest";
import express from "express";
import session from "express-session";
import request from "supertest";
import bcrypt from "bcryptjs";

// ── In-memory fake storage ────────────────────────────────────────────────────
const state = vi.hoisted(() => ({
  users: [] as any[],
  leads: [] as any[],
  listings: [] as any[],
  purchases: [] as any[],
  credits: new Map<number, number>(),
  optOuts: [] as any[],
  calls: [] as string[],
}));

vi.mock("../server/db", () => ({ db: { execute: async () => ({ rows: [] }) }, pool: {} }));
vi.mock("../server/jobs/ageLeads", () => ({ startAgingJob: () => {} }));
vi.mock("../server/storage", () => {
  const s = state;
  const leadOfListing = (listingId: number) => s.listings.find(l => l.id === listingId)?.leadId;
  const impl: Record<string, (...args: any[]) => any> = {
    getUserByUsername: async (u: string) => s.users.find(x => x.username === u),
    getUser: async (id: number) => s.users.find(x => x.id === id),
    getAllUsers: async () => s.users,
    createUser: async (u: any) => { const user = { id: s.users.length + 1, ...u }; s.users.push(user); return user; },
    getAllLeads: async () => s.leads,
    getLeadById: async (id: number) => s.leads.find(l => l.id === id),
    getLeadListingById: async (id: number) => s.listings.find(l => l.id === id),
    hasActiveListing: async (leadId: number) => s.listings.some(l => l.leadId === leadId && l.isActive),
    getPurchaseOfLead: async (userId: number, leadId: number) =>
      s.purchases.find(p => p.buyerId === userId && leadOfListing(p.listingId) === leadId),
    hasPurchasedLead: async (userId: number, leadId: number) =>
      s.purchases.some(p => p.buyerId === userId && leadOfListing(p.listingId) === leadId),
    getCreditAccount: async (userId: number) =>
      s.credits.has(userId) ? { userId, balance: s.credits.get(userId)!.toFixed(2) } : undefined,
    createCreditAccount: async (a: any) => { s.credits.set(a.userId, parseFloat(a.balance)); return a; },
    updateCreditBalance: async (userId: number, amount: string) => { s.credits.set(userId, (s.credits.get(userId) ?? 0) + parseFloat(amount)); },
    debitIfSufficient: async (userId: number, amount: string) => {
      const bal = s.credits.get(userId) ?? 0;
      if (bal < parseFloat(amount)) return false;
      s.credits.set(userId, bal - parseFloat(amount)); return true;
    },
    claimListing: async (id: number) => {
      const l = s.listings.find(x => x.id === id);
      if (!l?.isActive) return false;
      l.isActive = false; return true;
    },
    purchaseLead: async (p: any) => { const row = { id: s.purchases.length + 1, ...p }; s.purchases.push(row); return row; },
    recordOptOut: async (phone: string | null, email: string | null) => { s.optOuts.push({ phone, email }); return 0; },
    getUserByReferralCode: async () => undefined,
    claimPendingReferral: async () => undefined,
  };
  // Any method not implemented above is a harmless no-op that records its name.
  const storage = new Proxy(impl, {
    get: (target, prop: string) => target[prop] ?? (async () => { s.calls.push(prop); return undefined; }),
  });
  return { storage };
});

const { registerRoutes } = await import("../server/routes");

let app: express.Express;

async function agentFor(username: string, password: string) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ username, password });
  expect(res.status, `login ${username}: ${JSON.stringify(res.body)}`).toBe(200);
  return agent;
}

beforeAll(async () => {
  const hash = (p: string) => bcrypt.hash(p, 4);
  state.users.push(
    { id: 1, username: "admin", password: await hash("Admin-Password-1"), role: "admin", email: null },
    { id: 2, username: "alice", password: await hash("alice-password"), role: "agent", email: null },
    { id: 3, username: "bob",   password: await hash("bob-password"),   role: "agent", email: null },
    { id: 4, username: "legacy", password: await hash("admin123"),     role: "agent", email: null },
  );
  state.leads.push(
    { id: 10, firstName: "Jane", lastName: "Doe", email: "jane@example.com", phoneNumber: "3055551234", zipCode: "33101", state: "FL",
      dateOfBirth: "1957-03-14", annualIncome: 41234, householdSize: 1, interestedInMedicare: true, tcpaConsent: true, dnc: false, notes: "admin-only note" },
    { id: 11, firstName: "=HYPERLINK(\"http://x\")", lastName: "Smith", email: "s@example.com", phoneNumber: "2125550000", zipCode: "10001", state: "NY",
      dateOfBirth: null, annualIncome: null, householdSize: null, tcpaConsent: true, dnc: false, notes: null },
  );
  state.listings.push(
    { id: 100, leadId: 10, sellerId: 1, price: "40.00", qualityScore: 90, isActive: true },
    { id: 101, leadId: 11, sellerId: 3, price: "20.00", qualityScore: 70, isActive: true },
  );
  state.credits.set(2, 100);

  app = express();
  app.use(express.json());
  app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
  await registerRoutes(app);
});

describe("unauthenticated requests", () => {
  const protectedGets = [
    "/api/leads", "/api/leads/10", "/api/leads/stats", "/api/users", "/api/export/leads", "/api/export/my-leads",
    "/api/my-leads", "/api/admin/revenue", "/api/admin/health", "/api/admin/opt-outs", "/api/credits/1",
    "/api/lead-listings", "/api/lead-listings/all", "/api/dashboard", "/api/submissions", "/api/purchases/1",
  ];
  it.each(protectedGets)("GET %s → 401", async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(401);
  });

  it("unknown API route → JSON 404", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("agent cannot reach admin data", () => {
  const adminGets = ["/api/leads", "/api/leads/stats", "/api/users", "/api/export/leads", "/api/admin/revenue", "/api/admin/opt-outs", "/api/lead-listings/all"];
  it.each(adminGets)("GET %s → 403", async (path) => {
    const alice = await agentFor("alice", "alice-password");
    expect((await alice.get(path)).status).toBe(403);
  });

  it("cannot read another user's credits", async () => {
    const alice = await agentFor("alice", "alice-password");
    expect((await alice.get("/api/credits/3")).status).toBe(403);
  });

  it("cannot add credit to their own account", async () => {
    const alice = await agentFor("alice", "alice-password");
    const before = state.credits.get(2);
    const res = await alice.post("/api/credits/purchase").send({ amount: 1_000_000 });
    expect(res.status).toBe(403);
    expect(state.credits.get(2)).toBe(before);
  });

  it("admin can add credit to a user", async () => {
    const admin = await agentFor("admin", "Admin-Password-1");
    const res = await admin.post("/api/credits/purchase").send({ userId: 3, amount: 50 });
    expect(res.status).toBe(200);
    expect(state.credits.get(3)).toBe(50);
  });
});

describe("lead visibility", () => {
  it("non-owner sees only a masked preview of a lead for sale", async () => {
    const bob = await agentFor("bob", "bob-password");
    const res = await bob.get("/api/leads/10");
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.masked).toBe(true);
    expect(d.email).toBeNull();
    expect(d.phoneNumber).toBeNull();
    expect(d.zipCode).toBeNull();
    expect(d.notes).toBeNull();
    expect(d.firstName).toBe("J***");
    expect(d.dateOfBirth).toBe("1957-07-01");
    expect(d.annualIncome).toBe(40000);
    expect(JSON.stringify(d)).not.toContain("jane@example.com");
  });

  it("buyer sees full details after purchase, and the listing can't be sold twice", async () => {
    const alice = await agentFor("alice", "alice-password");
    expect((await alice.post("/api/lead-listings/100/purchase")).status).toBe(200);
    expect(state.credits.get(2)).toBe(60);

    const full = await alice.get("/api/leads/10");
    expect(full.body.data.email).toBe("jane@example.com");
    expect(full.body.data.notes).toBeNull(); // admin note is not exposed to buyers

    const bob = await agentFor("bob", "bob-password");
    expect((await bob.post("/api/lead-listings/100/purchase")).status).toBe(404);
    expect((await bob.get("/api/leads/10")).status).toBe(403); // no longer for sale, not owned
  });

  it("buyer can't buy with insufficient credit", async () => {
    state.credits.set(3, 5);
    const admin = await agentFor("admin", "Admin-Password-1");
    expect((await admin.post("/api/lead-listings/101/purchase")).status).toBe(400); // admin has no credit
  });

  it("seller can't buy their own listing", async () => {
    state.credits.set(3, 500);
    const bob = await agentFor("bob", "bob-password");
    const res = await bob.post("/api/lead-listings/101/purchase");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/own listing/);
  });

  it("activities on a lead are limited to admins and its buyer", async () => {
    const bob = await agentFor("bob", "bob-password");
    expect((await bob.get("/api/leads/10/activities")).status).toBe(403);
    expect((await bob.post("/api/leads/10/activities").send({ type: "note", notes: "x" })).status).toBe(403);
  });
});

describe("authentication rules", () => {
  it("rejects weak registrations", async () => {
    const res = await request(app).post("/api/auth/register").send({ username: "x", password: "123" });
    expect(res.status).toBe(400);
  });

  it("rejects default passwords in production", async () => {
    const prev = process.env.NODE_ENV;
    vi.resetModules();
    process.env.NODE_ENV = "production";
    try {
      const { registerRoutes: prodRoutes } = await import("../server/routes");
      const prodApp = express();
      prodApp.use(express.json());
      prodApp.use(session({ secret: "test", resave: false, saveUninitialized: false }));
      await prodRoutes(prodApp);
      const res = await request(prodApp).post("/api/auth/login").send({ username: "legacy", password: "admin123" });
      expect(res.status).toBe(403);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});

describe("public endpoints", () => {
  it("opt-out gives the same answer whether or not the person is known", async () => {
    const a = await request(app).post("/api/opt-out").send({ phoneNumber: "(305) 555-1234" });
    const b = await request(app).post("/api/opt-out").send({ phoneNumber: "999-999-9999" });
    expect(a.status).toBe(200);
    expect(a.body).toEqual(b.body);
    expect(state.optOuts.at(-2)).toEqual({ phone: "3055551234", email: null });
  });

  it("opt-out needs a phone or email", async () => {
    expect((await request(app).post("/api/opt-out").send({})).status).toBe(400);
  });

  it("health check responds", async () => {
    expect((await request(app).get("/api/health")).body.status).toBe("ok");
  });
});

describe("CSV export", () => {
  it("neutralizes spreadsheet formulas in exported fields", async () => {
    const admin = await agentFor("admin", "Admin-Password-1");
    const res = await admin.get("/api/export/leads");
    expect(res.status).toBe(200);
    expect(res.text).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(res.text).not.toMatch(/,=HYPERLINK/);
  });
});
