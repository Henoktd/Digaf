import { Router } from "express";
import { pool } from "../db/pool";

export const shareClassRoutes = Router();

shareClassRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        share_class_id,
        entity_id,
        class_name,
        voting_rights,
        votes_per_share,
        voting_class_tier,
        par_value,
        status,
        notes,
        created_at
      FROM share_class
      ORDER BY created_at ASC
    `);

    res.json({
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch share classes",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});