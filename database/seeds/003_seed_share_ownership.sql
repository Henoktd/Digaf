WITH digaf AS (
  SELECT entity_id
  FROM entity
  WHERE legal_name = 'Digaf Microcredit Provider SC'
),
ordinary AS (
  SELECT sc.share_class_id
  FROM share_class sc
  JOIN digaf d ON d.entity_id = sc.entity_id
  WHERE sc.class_name = 'Ordinary Shares'
),
shareholders AS (
  SELECT shareholder_id, legal_name
  FROM shareholder
  WHERE entity_id = (SELECT entity_id FROM digaf)
)
INSERT INTO share_ownership (
  shareholder_id,
  share_class_id,
  quantity,
  pledged_quantity,
  encumbered_quantity,
  effective_date,
  status
)
SELECT
  s.shareholder_id,
  o.share_class_id,
  CASE
    WHEN s.legal_name = 'Digaf Founding Shareholder Group' THEN 6000
    WHEN s.legal_name = 'Abebe Kebede' THEN 2500
    WHEN s.legal_name = 'Hana Tesfaye' THEN 1500
    ELSE 0
  END,
  CASE
    WHEN s.legal_name = 'Abebe Kebede' THEN 500
    ELSE 0
  END,
  CASE
    WHEN s.legal_name = 'Hana Tesfaye' THEN 200
    ELSE 0
  END,
  CURRENT_DATE,
  'active'
FROM shareholders s
CROSS JOIN ordinary o
WHERE NOT EXISTS (
  SELECT 1
  FROM share_ownership so
  WHERE so.shareholder_id = s.shareholder_id
    AND so.share_class_id = o.share_class_id
);
