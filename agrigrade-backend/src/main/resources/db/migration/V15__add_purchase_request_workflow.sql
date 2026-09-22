-- ============================================================
-- V15__add_purchase_request_workflow.sql
-- AgriGrade AI — Buyer Purchase Request Workflow Schema
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS purchase_requests;

CREATE TABLE purchase_requests (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    request_public_id VARCHAR(50) UNIQUE NOT NULL,
    listing_id BIGINT UNSIGNED NOT NULL,
    buyer_user_id BIGINT UNSIGNED NOT NULL,
    farmer_user_id BIGINT UNSIGNED NOT NULL,
    requested_quantity DECIMAL(12,2) NOT NULL,
    offered_price_per_kg DECIMAL(12,2) NULL,
    requested_total_price DECIMAL(14,2) NULL,
    buyer_message VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    counter_price_per_kg DECIMAL(12,2) NULL,
    counter_quantity DECIMAL(12,2) NULL,
    farmer_response_message VARCHAR(2000) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    responded_at DATETIME NULL,
    expires_at DATETIME NULL,
    CONSTRAINT fk_pr_listing FOREIGN KEY (listing_id) REFERENCES marketplace_listings (id) ON DELETE CASCADE,
    CONSTRAINT fk_pr_buyer FOREIGN KEY (buyer_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_pr_farmer FOREIGN KEY (farmer_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance & Query Optimization Indexes
CREATE INDEX idx_pr_listing ON purchase_requests (listing_id);
CREATE INDEX idx_pr_buyer ON purchase_requests (buyer_user_id, status);
CREATE INDEX idx_pr_farmer ON purchase_requests (farmer_user_id, status);
CREATE INDEX idx_pr_status ON purchase_requests (status);
CREATE INDEX idx_pr_created ON purchase_requests (created_at DESC);

SET FOREIGN_KEY_CHECKS = 1;
