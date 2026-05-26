import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db/pool";
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

dotenv.config();

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

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Digaf Governance Platform API running on port ${port}`);
  });
}

export default app;
