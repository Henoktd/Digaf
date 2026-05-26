"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogRoutes = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
exports.auditLogRoutes = (0, express_1.Router)();
exports.auditLogRoutes.get("/", async (_req, res) => {
    try {
        const result = await pool_1.pool.query(`
      SELECT
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
    `);
        res.json({
            data: result.rows,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch audit logs",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
//# sourceMappingURL=auditLogRoutes.js.map