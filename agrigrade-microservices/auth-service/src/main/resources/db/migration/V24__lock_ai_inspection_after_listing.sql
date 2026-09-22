-- V24__lock_ai_inspection_after_listing.sql
-- Add lock columns to product_batches, marketplace_listings, and ai_analyses

ALTER TABLE product_batches
  ADD COLUMN inspection_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN inspection_locked_at DATETIME NULL;

ALTER TABLE marketplace_listings
  ADD COLUMN certification_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN certification_locked_at DATETIME NULL;

ALTER TABLE ai_analyses
  ADD COLUMN inspection_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN locked_at DATETIME NULL;

-- Backfill existing published / listed batches and listings
UPDATE product_batches pb
JOIN marketplace_listings ml ON ml.batch_id = pb.id
SET pb.inspection_locked = TRUE,
    pb.inspection_locked_at = NOW(),
    ml.certification_locked = TRUE,
    ml.certification_locked_at = NOW()
WHERE pb.status = 'LISTED' OR ml.status = 'ACTIVE';

UPDATE ai_analyses aa
JOIN product_batches pb ON aa.batch_id = pb.id
SET aa.inspection_locked = TRUE,
    aa.locked_at = NOW()
WHERE pb.inspection_locked = TRUE;
