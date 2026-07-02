import { Router } from "express";
import { pool } from "../db/pool";
import { requireRole } from "../utils/roles";
import { sendForbidden, sendServerError } from "../utils/apiError";

export const entityRoutes = Router();

entityRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
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
        authorized_capital,
        subscribed_capital,
        paid_up_capital,
        default_par_value,
        head_office_city,
        head_office_wereda,
        head_office_kk,
        head_office_house_no,
        head_office_po_box,
        created_at
      FROM entity
      ORDER BY created_at ASC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    return sendServerError(res, "Failed to fetch entities", error);
  }
});

entityRoutes.patch("/:entityId", async (req, res) => {
  const roleCheck = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleCheck.ok) return sendForbidden(res, roleCheck.message);

  const { entityId } = req.params;
  const {
    authorized_capital, subscribed_capital, paid_up_capital, default_par_value,
    head_office_city, head_office_wereda, head_office_kk, head_office_house_no, head_office_po_box,
  } = req.body ?? {};

  try {
    await pool.query(
      `UPDATE entity SET
        authorized_capital = $1,
        subscribed_capital = $2,
        paid_up_capital = $3,
        default_par_value = $4,
        head_office_city = $6,
        head_office_wereda = $7,
        head_office_kk = $8,
        head_office_house_no = $9,
        head_office_po_box = $10
      WHERE entity_id = $5`,
      [
        authorized_capital != null && authorized_capital !== "" ? Number(authorized_capital) : null,
        subscribed_capital != null && subscribed_capital !== "" ? Number(subscribed_capital) : null,
        paid_up_capital != null && paid_up_capital !== "" ? Number(paid_up_capital) : null,
        default_par_value != null && default_par_value !== "" ? Number(default_par_value) : null,
        entityId,
        head_office_city || null,
        head_office_wereda || null,
        head_office_kk || null,
        head_office_house_no || null,
        head_office_po_box || null,
      ]
    );
    res.json({ data: { entity_id: entityId, updated: true } });
  } catch (error) {
    return sendServerError(res, "Failed to update entity", error);
  }
});
