"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entityRoutes = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
exports.entityRoutes = (0, express_1.Router)();
exports.entityRoutes.get("/", async (_req, res) => {
    try {
        const result = await pool_1.pool.query(`
      SELECT
        entity_id,
        legal_name,
        type,
        status,
        branding_config,
        certificate_template_config,
        workflow_config,
        entra_tenant_id,
        sharepoint_site_url,
        created_at
      FROM entity
      ORDER BY created_at ASC
    `);
        res.json({
            data: result.rows,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch entities",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
//# sourceMappingURL=entityRoutes.js.map