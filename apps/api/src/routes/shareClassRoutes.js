"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareClassRoutes = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
exports.shareClassRoutes = (0, express_1.Router)();
exports.shareClassRoutes.get("/", async (_req, res) => {
    try {
        const result = await pool_1.pool.query(`
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
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch share classes",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
//# sourceMappingURL=shareClassRoutes.js.map