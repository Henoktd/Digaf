"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legalHoldRoutes = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
exports.legalHoldRoutes = (0, express_1.Router)();
exports.legalHoldRoutes.get("/", async (_req, res) => {
    try {
        const result = await pool_1.pool.query(`
      SELECT
        lh.id,
        lh.entity_id,
        e.legal_name AS entity_name,
        lh.hold_type,
        lh.related_record_type,
        lh.related_record_id,
        s.legal_name AS related_shareholder_name,
        lh.imposed_by,
        lh.imposed_at,
        lh.reason,
        lh.status,
        lh.lifted_by,
        lh.lifted_at,
        lh.authority_reference,
        tf.id AS transfer_freeze_id,
        tf.freeze_type,
        tf.status AS freeze_status,
        tf.reason AS freeze_reason,
        tf.imposed_at AS freeze_imposed_at
      FROM legal_hold lh
      JOIN entity e ON e.entity_id = lh.entity_id
      LEFT JOIN shareholder s
        ON lh.related_record_type = 'shareholder'
        AND s.shareholder_id = lh.related_record_id
      LEFT JOIN LATERAL (
        SELECT
          id,
          freeze_type,
          status,
          reason,
          imposed_at
        FROM transfer_freeze
        WHERE shareholder_id = s.shareholder_id
          AND status = 'active'
        ORDER BY imposed_at DESC
        LIMIT 1
      ) tf ON true
      ORDER BY
        CASE WHEN lh.status = 'active' THEN 0 ELSE 1 END,
        lh.imposed_at DESC
    `);
        res.json({
            data: result.rows,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch legal holds",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
//# sourceMappingURL=legalHoldRoutes.js.map