import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db/pool";
import { entityRoutes } from "./routes/entityRoutes";
import { shareClassRoutes } from "./routes/shareClassRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 4000;

app.get("/", (_req, res) => {
  res.json({
    service: "SVH Governance Platform API",
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

app.use("/api/entities", entityRoutes);
app.use("/api/share-classes", shareClassRoutes);

app.listen(port, () => {
  console.log(`SVH Governance Platform API running on port ${port}`);
});