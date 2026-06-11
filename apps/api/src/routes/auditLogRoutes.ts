import { Router } from "express";
import { pool } from "../db/pool";

export const auditLogRoutes = Router();

auditLogRoutes.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50));
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT
          al.id,
          al.entity_id,
          e.legal_name AS entity_name,
          al.actor_id,
          al.action,
          al.table_name,
          al.record_id,
          al.old_value_json,
          al.new_value_json,
          al.timestamp_utc,
          al.source_ip
        FROM audit_log al
        JOIN entity e ON e.entity_id = al.entity_id
        ORDER BY al.timestamp_utc DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM audit_log`),
    ]);

    res.json({
      data: dataResult.rows,
      total: countResult.rows[0]?.total ?? 0,
      page,
      limit,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch audit logs",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
