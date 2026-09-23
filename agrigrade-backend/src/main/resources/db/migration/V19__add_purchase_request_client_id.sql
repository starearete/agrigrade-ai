ALTER TABLE purchase_requests
ADD COLUMN client_request_id VARCHAR(64) NULL;

ALTER TABLE purchase_requests
ADD INDEX idx_pr_buyer_client_id (buyer_user_id, client_request_id);