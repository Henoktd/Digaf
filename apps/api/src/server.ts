import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db/pool";
import { requireAuth } from "./middleware/requireAuth";
import { entityRoutes } from "./routes/entityRoutes";
import { shareClassRoutes } from "./routes/shareClassRoutes";
import { shareholderRoutes } from "./routes/shareholderRoutes";
import { capTableRoutes } from "./routes/capTableRoutes";
import { certificateRoutes } from "./routes/certificateRoutes";
import { transferRoutes } from "./routes/transferRoutes";
import { approvalRoutes } from "./routes/approvalRoutes";
import { auditLogRoutes } from "./routes/auditLogRoutes";
import { slaRoutes } from "./routes/slaRoutes";
import { legalHoldRoutes } from "./routes/legalHoldRoutes";
import { communicationRoutes } from "./routes/communicationRoutes";
import { documentRoutes } from "./routes/documentRoutes";
import { dashboardRoutes } from "./routes/dashboardRoutes";
import { integrationRoutes } from "./routes/integrationRoutes";
import { importRoutes } from "./routes/importRoutes";
import { boardResolutionRoutes } from "./routes/boardResolutionRoutes";
import { slaConfigRoutes } from "./routes/slaConfigRoutes";

dotenv.config();

function validateRequiredEnv() {
  const required = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0 && process.env.NODE_ENV === "production") {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}
validateRequiredEnv();

const rateLimitStore = new Map<string, number[]>();

function createRateLimiter(windowMs: number, max: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const forwarded = (req.headers["x-forwarded-for"] as string) || "";
    const ip = forwarded.split(",")[0].trim() || (req.socket as { remoteAddress?: string } | null)?.remoteAddress || "unknown";
    const now = Date.now();
    const cutoff = now - windowMs;
    const hits = (rateLimitStore.get(ip) ?? []).filter((t) => t > cutoff);
    if (hits.length >= max) {
      res.status(429).json({ error: "Too many requests. Please slow down." });
      return;
    }
    hits.push(now);
    rateLimitStore.set(ip, hits);
    next();
  };
}

const generalLimiter = createRateLimiter(60_000, 60);
const importLimiter = createRateLimiter(60_000, 20);
const verifyLimiter = createRateLimiter(60_000, 30);

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  allowedOrigins?.length
    ? cors({
        origin(origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
          }

          callback(null, false);
        },
      })
    : cors()
);
app.use(express.json());

const port = process.env.PORT || 4000;

app.get("/", (_req, res) => {
  res.json({
    service: "Digaf Shareholder Governance Platform API",
    architecture: "Final v3 - No Dataverse",
    status: "running",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestampUtc: new Date().toISOString(),
  });
});

app.get("/health/db", async (_req, res) => {
  try {
    const result = await pool.query("select now() as database_time");
    res.json({
      status: "ok",
      database: "connected",
      databaseTime: result.rows[0].database_time,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "not connected",
      message: error instanceof Error ? error.message : "Unknown database error",
    });
  }
});

app.get("/api/version", (_req, res) => {
  res.json({
    name: "Digaf Shareholder Governance Platform API",
    architecture: "Final v3 - No Dataverse",
    environment: process.env.NODE_ENV || "local",
    status: "ok",
    timestampUtc: new Date().toISOString(),
  });
});

// Rate limiting
app.use("/api", generalLimiter);
app.use("/api/imports", importLimiter);
app.use("/api/certificates", (req, res, next) => {
  if (req.method === "GET" && req.path.startsWith("/verify")) {
    return verifyLimiter(req, res, next);
  }
  return next();
});

// Apply requireAuth to all /api/* routes.
// Exception: public QR certificate verification needs no login.
app.use("/api", (req, res, next) => {
  const isPublicVerify =
    req.method === "GET" && req.path.startsWith("/certificates/verify");
  if (isPublicVerify) return next();
  return requireAuth(req, res, next);
});

app.use("/api/entities", entityRoutes);
app.use("/api/share-classes", shareClassRoutes);
app.use("/api/shareholders", shareholderRoutes);
app.use("/api/cap-table", capTableRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/sla-monitor", slaRoutes);
app.use("/api/legal-holds", legalHoldRoutes);
app.use("/api/communications", communicationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/imports", importRoutes);
app.use("/api/board-resolutions", boardResolutionRoutes);
app.use("/api/sla-config", slaConfigRoutes);

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Digaf Governance Platform API running on port ${port}`);
  });
}

export default app;
