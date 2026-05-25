import { Router } from "express";
import { pool } from "../db/pool";

export const documentRoutes = Router();

documentRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        dr.id,
        dr.entity_id,
        e.legal_name AS entity_name,
        dr.file_url,
        dr.library,
        dr.document_type,
        dr.metadata_json,
        dr.retention_category,
        dr.legal_hold_id,
        lh.status AS legal_hold_status,
        lh.authority_reference,
        dr.related_entity,
        dr.related_id,
        dr.created_at
      FROM document_reference dr
      JOIN entity e ON e.entity_id = dr.entity_id
      LEFT JOIN legal_hold lh ON lh.id = dr.legal_hold_id
      ORDER BY dr.created_at DESC
    `);

    res.json({
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch documents",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
