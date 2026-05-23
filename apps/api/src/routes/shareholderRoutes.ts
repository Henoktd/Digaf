import { Router } from "express";
import { pool } from "../db/pool";

export const shareholderRoutes = Router();

shareholderRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        shareholder_id,
        entity_id,
        legal_name,
        type,
        status,
        contact_details,
        kyc_status,
        kyc_expiry,
        risk_classification,
        proxy_eligible,
        relationship_start_date,
        created_at
      FROM shareholder
      ORDER BY legal_name ASC
    `);

    res.json({
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch shareholders",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});