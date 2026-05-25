import { Router } from "express";
import { pool } from "../db/pool";

export const communicationRoutes = Router();

communicationRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        cl.id,
        cl.entity_id,
        e.legal_name AS entity_name,
        cl.type,
        cl.recipient_id,
        s.legal_name AS recipient_name,
        cl.channel,
        cl.subject,
        cl.delivery_status,
        cl.sent_at,
        cl.related_event_id,
        cl.created_at
      FROM communication_log cl
      JOIN entity e ON e.entity_id = cl.entity_id
      LEFT JOIN shareholder s ON s.shareholder_id = cl.recipient_id
      ORDER BY cl.created_at DESC
    `);

    res.json({
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch communications",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
