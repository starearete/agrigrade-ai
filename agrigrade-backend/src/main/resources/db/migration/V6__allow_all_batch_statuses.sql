-- V6: Update product_batches status column to allow all batch statuses (AI_GRADED, AI_VERIFIED, etc.)
ALTER TABLE product_batches MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'HARVESTED';
