import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const PgSession = connectPgSimple(session);

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// Replit deployments sit behind a TLS-terminating proxy. Without this, req.secure
// is false and express-session never sets the `secure` session cookie in production.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet({
  // Vite's dev server injects inline scripts, so only enforce CSP on the built app.
  contentSecurityPolicy: isProduction ? {
    useDefaults: true,
    directives: {
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "img-src": ["'self'", "data:", "blob:", "https://images.unsplash.com"],
      "connect-src": ["'self'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// Throttle credential guessing and sign-up spam.
app.use(["/api/auth/login", "/api/auth/register"], rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Try again in 15 minutes." },
}));
// Public lead-capture form: allow real traffic, stop bulk junk submissions.
const leadCaptureLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions. Try again later." },
});
app.use("/api/opt-out", rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Try again later." },
}));
app.use("/api/leads", (req, res, next) => (req.method === "POST" && req.path === "/" ? leadCaptureLimiter(req, res, next) : next()));

if (isProduction && !process.env.SESSION_SECRET) {
  console.error("[fatal] SESSION_SECRET environment variable must be set in production");
  process.exit(1);
}

app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "healthlead-pro-dev-secret-do-not-use-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  },
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  // Response bodies are not logged: they contain consumer PII (names, phones, DOB).
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error("[error]", err);
    // Don't leak internal error details to clients on server errors.
    const message = status >= 500 ? "Internal Server Error" : (err.message || "Request failed");
    if (res.headersSent) return;
    res.status(status).json({ success: false, message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
})();
