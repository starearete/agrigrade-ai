-- ============================================================
-- V14__add_realtime_chat_and_conversations.sql
-- AgriGrade AI — Real-Time Farmer ↔ Buyer Chat Schema
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS message_attachments;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS conversations;

CREATE TABLE conversations (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    conversation_public_id VARCHAR(36) NOT NULL UNIQUE,
    farmer_user_id BIGINT UNSIGNED NOT NULL,
    buyer_user_id BIGINT UNSIGNED NOT NULL,
    listing_id BIGINT UNSIGNED NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    last_message_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_conv_farmer FOREIGN KEY (farmer_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_buyer FOREIGN KEY (buyer_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_listing FOREIGN KEY (listing_id) REFERENCES marketplace_listings (id) ON DELETE SET NULL,
    CONSTRAINT uq_farmer_buyer_listing UNIQUE (farmer_user_id, buyer_user_id, listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_messages (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    message_public_id VARCHAR(36) NOT NULL UNIQUE,
    conversation_id BIGINT UNSIGNED NOT NULL,
    sender_user_id BIGINT UNSIGNED NOT NULL,
    recipient_user_id BIGINT UNSIGNED NOT NULL,
    message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT',
    encrypted_content TEXT NOT NULL,
    client_message_id VARCHAR(64) NULL,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at DATETIME NULL,
    read_at DATETIME NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SENT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_sender_client_msg UNIQUE (sender_user_id, client_message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance & Query Optimization Indexes
CREATE INDEX idx_conversations_farmer ON conversations (farmer_user_id, status);
CREATE INDEX idx_conversations_buyer ON conversations (buyer_user_id, status);
CREATE INDEX idx_conversations_last_msg ON conversations (last_message_at DESC);

CREATE INDEX idx_chat_messages_conv_sent ON chat_messages (conversation_id, sent_at ASC);
CREATE INDEX idx_chat_messages_sender ON chat_messages (sender_user_id);
CREATE INDEX idx_chat_messages_recipient_status ON chat_messages (recipient_user_id, status);
CREATE INDEX idx_chat_messages_client_msg ON chat_messages (client_message_id);

SET FOREIGN_KEY_CHECKS = 1;
