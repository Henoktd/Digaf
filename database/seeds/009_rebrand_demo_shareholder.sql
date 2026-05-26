BEGIN;

UPDATE shareholder
SET
  legal_name = CASE
    WHEN legal_name = 'SVH Strategic Holdings'
      THEN 'Digaf Founding Shareholder Group'
    ELSE legal_name
  END,
  contact_details = CASE
    WHEN contact_details->>'email' = 'governance@svh.example.com'
      THEN jsonb_set(
        COALESCE(contact_details, '{}'::jsonb),
        '{email}',
        to_jsonb('governance@digaf.example.com'::text),
        true
      )
    ELSE contact_details
  END
WHERE legal_name = 'SVH Strategic Holdings'
   OR contact_details->>'email' = 'governance@svh.example.com';

COMMIT;
