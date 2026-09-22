-- V19: Add client_request_id column to purchase_requests for idempotency protection
ALTER TABLE purchase_requests 
ADD COLUMN client_request_id VARCHAR(64) NULL AFTER request_public_id,
ADD INDEX idx_pr_buyer_client_id (buyer_user_id, client_request_id);
