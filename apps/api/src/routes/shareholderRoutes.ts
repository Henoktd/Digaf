import { Router } from "express";
import { pool } from "../db/pool";
import {
  sendBadRequest,
  sendNotFound,
  sendServerError,
} from "../utils/apiError";
import { requireUuid } from "../utils/validation";

export const shareholderRoutes = Router();

shareholderRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        shareholder_id,
        entity_id,
        legal_name,
        type,
        status,
        contact_details,
        kyc_status,
        kyc_expiry,
        risk_classification,
        proxy_eligible,
        relationship_start_date,
        created_at
      FROM shareholder
      ORDER BY legal_name ASC
    `);

    res.json({
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch shareholders",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

shareholderRoutes.get("/:shareholderId", async (req, res) => {
  let shareholderId = "";

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid shareholder request"
    );
  }

  try {
    const profileResult = await pool.query(
      `
      SELECT
        s.shareholder_id,
        s.entity_id,
        e.legal_name AS entity_name,
        s.legal_name,
        s.type,
        s.status,
        s.contact_details,
        s.kyc_status,
        s.kyc_expiry,
        s.risk_classification,
        s.proxy_eligible,
        s.relationship_start_date,
        s.created_at
      FROM shareholder s
      JOIN entity e ON e.entity_id = s.entity_id
      WHERE s.shareholder_id = $1
      LIMIT 1
      `,
      [shareholderId]
    );

    if (profileResult.rowCount === 0) {
      return sendNotFound(res, "Shareholder not found");
    }

    const [
      ownershipResult,
      certificatesResult,
      outgoingTransfersResult,
      incomingTransfersResult,
      legalHoldsResult,
      documentsResult,
      communicationsResult,
    ] = await Promise.all([
      pool.query(
        `
        SELECT
          sc.class_name AS share_class,
          so.quantity,
          so.pledged_quantity,
          so.encumbered_quantity,
          so.effective_date,
          so.status
        FROM share_ownership so
        JOIN share_class sc ON sc.share_class_id = so.share_class_id
        WHERE so.shareholder_id = $1
        ORDER BY
          CASE WHEN so.status = 'active' THEN 0 ELSE 1 END,
          so.effective_date DESC,
          sc.class_name ASC
        `,
        [shareholderId]
      ),
      pool.query(
        `
        SELECT
          c.certificate_id,
          c.serial_number,
          sc.class_name AS share_class,
          c.quantity,
          c.issue_date,
          c.status,
          c.hash_algorithm,
          c.revocation_status
        FROM share_certificate c
        JOIN share_class sc ON sc.share_class_id = c.share_class_id
        WHERE c.shareholder_id = $1
        ORDER BY c.created_at DESC
        `,
        [shareholderId]
      ),
      pool.query(
        `
        SELECT
          st.id,
          transferee.legal_name AS transferee_name,
          st.shares,
          st.status,
          st.kyc_check_status,
          st.encumbrance_check_status,
          st.effective_date,
          st.created_at
        FROM share_transfer st
        JOIN shareholder transferee
          ON transferee.shareholder_id = st.transferee_id
        WHERE st.transferor_id = $1
        ORDER BY st.created_at DESC
        `,
        [shareholderId]
      ),
      pool.query(
        `
        SELECT
          st.id,
          transferor.legal_name AS transferor_name,
          st.shares,
          st.status,
          st.kyc_check_status,
          st.encumbrance_check_status,
          st.effective_date,
          st.created_at
        FROM share_transfer st
        JOIN shareholder transferor
          ON transferor.shareholder_id = st.transferor_id
        WHERE st.transferee_id = $1
        ORDER BY st.created_at DESC
        `,
        [shareholderId]
      ),
      pool.query(
        `
        SELECT
          lh.id,
          lh.hold_type,
          lh.reason,
          lh.status,
          lh.authority_reference,
          lh.imposed_by,
          lh.imposed_at
        FROM legal_hold lh
        WHERE lh.related_record_type = 'shareholder'
          AND lh.related_record_id = $1
        ORDER BY
          CASE WHEN lh.status = 'active' THEN 0 ELSE 1 END,
          lh.imposed_at DESC
        `,
        [shareholderId]
      ),
      pool.query(
        `
        WITH shareholder_records AS (
          SELECT $1::uuid AS related_id
          UNION
          SELECT c.certificate_id
          FROM share_certificate c
          WHERE c.shareholder_id = $1
          UNION
          SELECT st.id
          FROM share_transfer st
          WHERE st.transferor_id = $1
             OR st.transferee_id = $1
          UNION
          SELECT lh.id
          FROM legal_hold lh
          WHERE lh.related_record_type = 'shareholder'
            AND lh.related_record_id = $1
        )
        SELECT
          dr.id,
          dr.document_type,
          dr.library,
          dr.retention_category,
          dr.file_url,
          dr.legal_hold_id,
          dr.created_at
        FROM document_reference dr
        WHERE dr.related_id IN (SELECT related_id FROM shareholder_records)
           OR dr.legal_hold_id IN (
             SELECT lh.id
             FROM legal_hold lh
             WHERE lh.related_record_type = 'shareholder'
               AND lh.related_record_id = $1
           )
        ORDER BY dr.created_at DESC
        `,
        [shareholderId]
      ),
      pool.query(
        `
        SELECT
          cl.id,
          cl.type,
          cl.channel,
          cl.subject,
          cl.delivery_status,
          cl.sent_at,
          cl.created_at
        FROM communication_log cl
        WHERE cl.recipient_id = $1
        ORDER BY cl.created_at DESC
        `,
        [shareholderId]
      ),
    ]);

    res.json({
      data: {
        profile: profileResult.rows[0],
        ownership: ownershipResult.rows,
        certificates: certificatesResult.rows,
        outgoing_transfers: outgoingTransfersResult.rows,
        incoming_transfers: incomingTransfersResult.rows,
        legal_holds: legalHoldsResult.rows,
        documents: documentsResult.rows,
        communications: communicationsResult.rows,
      },
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch shareholder profile", error);
  }
});
