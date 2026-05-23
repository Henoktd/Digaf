import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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

app.listen(port, () => {
  console.log(`SVH Governance Platform API running on port ${port}`);
});