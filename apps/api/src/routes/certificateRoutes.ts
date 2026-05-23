import { Router } from "express";
import { pool } from "../db/pool";

export const certificateRoutes = Router();

certificateRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.certificate_id,
        c.entity_id,
        e.legal_name AS entity_name,
        c.serial_number,
        c.shareholder_id,
        s.legal_name AS shareholder_name,
        c.share_class_id,
        sc.class_name AS share_class,
        c.quantity,
        c.issue_date,
        c.status,
        c.qr_token,
        c.certificate_hash,
        c.hash_algorithm,
        c.hash_generated_at,
        c.revocation_status,
        c.reissue_reference,
        c.created_at
      FROM share_certificate c
      JOIN entity e ON e.entity_id = c.entity_id
      JOIN shareholder s ON s.shareholder_id = c.shareholder_id
      JOIN share_class sc ON sc.share_class_id = c.share_class_id
      ORDER BY c.created_at DESC
    `);

    res.json({
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch certificates",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

certificateRoutes.get("/verify/:serialNumber", async (req, res) => {
  try {
    const { serialNumber } = req.params;

    const result = await pool.query(
      `
      SELECT
        c.serial_number,
        e.legal_name AS issuing_company,
        sc.class_name AS share_class,
        c.quantity,
        c.issue_date,
        c.status,
        c.revocation_status,
        c.hash_algorithm,
        c.hash_generated_at,
        CASE
          WHEN c.certificate_hash IS NOT NULL THEN 'hash_available'
          ELSE 'hash_missing'
        END AS hash_verification_result,
        now() AS verification_timestamp
      FROM share_certificate c
      JOIN entity e ON e.entity_id = c.entity_id
      JOIN share_class sc ON sc.share_class_id = c.share_class_id
      WHERE c.serial_number = $1
      LIMIT 1
      `,
      [serialNumber]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "not_found",
        message: "Certificate not found",
        verificationTimestamp: new Date().toISOString(),
      });
    }

    res.json({
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to verify certificate",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});