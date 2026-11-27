import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { renderIndexHtml } from "./seo";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Hashed build assets never change, so let browsers cache them for a year.
  app.use("/assets", express.static(path.join(distPath, "assets"), { immutable: true, maxAge: "1y", index: false }));
  app.use(express.static(distPath, { index: false, maxAge: "1h" }));

  // Client-side routes (keep in sync with client/src/App.tsx). Anything else gets
  // the app shell with a real 404 status so search engines don't index junk URLs.
  const clientRoutes = new Set([
    "/", "/login", "/privacy", "/terms", "/opt-out",
    "/dashboard", "/leads", "/home", "/thank-you",
    "/marketplace", "/sell", "/referrals", "/admin", "/profile",
  ]);
  const template = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");
  const cache = new Map<string, string>();
  app.use("*", (req, res) => {
    const pathname = req.originalUrl.split("?")[0].replace(/\/+$/, "") || "/";
    const known = clientRoutes.has(pathname);
    const key = known ? pathname : "__404__";
    let html = cache.get(key);
    if (!html) { html = renderIndexHtml(template, known ? pathname : "/__404__", known); cache.set(key, html); }
    res.status(known ? 200 : 404)
      .set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" })
      .send(html);
  });
}
