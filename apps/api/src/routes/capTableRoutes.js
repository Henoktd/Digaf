"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capTableRoutes = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
exports.capTableRoutes = (0, express_1.Router)();
exports.capTableRoutes.get("/", async (_req, res) => {
    try {
        const result = await pool_1.pool.query(`
      WITH ownership AS (
        SELECT
          e.entity_id,
          e.legal_name AS entity_name,
          s.shareholder_id,
          s.legal_name AS shareholder_name,
          s.type AS shareholder_type,
          sc.class_name AS share_class,
          so.quantity,
          so.pledged_quantity,
          so.encumbered_quantity,
          so.status,
          SUM(so.quantity) OVER (PARTITION BY e.entity_id) AS total_entity_shares
        FROM share_ownership so
        JOIN shareholder s ON s.shareholder_id = so.shareholder_id
        JOIN share_class sc ON sc.share_class_id = so.share_class_id
        JOIN entity e ON e.entity_id = s.entity_id
        WHERE so.status = 'active'
      )
      SELECT
        entity_id,
        entity_name,
        shareholder_id,
        shareholder_name,
        shareholder_type,
        share_class,
        quantity,
        pledged_quantity,
        encumbered_quantity,
        status,
        total_entity_shares,
        ROUND((quantity / NULLIF(total_entity_shares, 0)) * 100, 2) AS ownership_percentage
      FROM ownership
      ORDER BY quantity DESC
    `);
        res.json({
            data: result.rows,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch cap table",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
//# sourceMappingURL=capTableRoutes.js.map