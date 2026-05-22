import express from "express";
import compression from "compression";
import helmet from "helmet";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createApiRouter } from "./routes/api.js";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLIENT_ORIGIN } from "./config/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");

export function createApp(store) {
  const app = express();
  
  // Use Helmet for security headers, but disable CSP so it doesn't break Vite/React client
  app.use(helmet({ contentSecurityPolicy: false }));
  
  // Keep HTTP CORS aligned with Socket.io CORS for split Vercel/Render deployments.
  const allowedOrigins = CLIENT_ORIGIN.split(",").map((origin) => origin.trim());
  app.use(cors({
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins
  }));
  
  app.use(compression());
  app.use(express.json());

  // Log API and page requests, skip static assets
  const STATIC_EXT = /\.(js|css|png|jpg|jpeg|svg|ico|woff2?|map|webp)$/i;
  app.use((req, res, next) => {
    if (!STATIC_EXT.test(req.url)) {
      logger.info("HTTP request", { method: req.method, url: req.url, ip: req.ip });
    }
    next();
  });

  // Mount REST API
  app.use("/api", createApiRouter(store));

  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });

  app.use(errorHandler);

  return app;
}
