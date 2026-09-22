-- ============================================================
-- V20__one_conversation_model_and_notifications.sql
-- AgriGrade AI — Unified 1-to-1 Farmer ↔ Buyer Conversation & Notifications Schema
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Migrate & Merge duplicate conversations between same farmer & buyer
UPDATE chat_messages cm
JOIN conversations c_old ON cm.conversation_id = c_old.id
JOIN (
    SELECT farmer_user_id, buyer_user_id, MIN(id) AS primary_id
    FROM conversations
    GROUP BY farmer_user_id, buyer_user_id
) c_prim ON c_old.farmer_user_id = c_prim.farmer_user_id AND c_old.buyer_user_id = c_prim.buyer_user_id
SET cm.conversation_id = c_prim.primary_id
WHERE c_old.id != c_prim.primary_id;

DELETE c FROM conversations c
JOIN (
    SELECT farmer_user_id, buyer_user_id, MIN(id) AS primary_id
    FROM conversations
    GROUP BY farmer_user_id, buyer_user_id
) c_prim ON c.farmer_user_id = c_prim.farmer_user_id AND c.buyer_user_id = c_prim.buyer_user_id
WHERE c.id != c_prim.primary_id;

-- 2. Drop old multi-listing unique key on conversations if it exists, and add uq_farmer_buyer if missing
SET @exist_old := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'conversations' AND index_name = 'uq_farmer_buyer_listing');
SET @sqlstmt_old := IF(@exist_old > 0, 'ALTER TABLE conversations DROP INDEX uq_farmer_buyer_listing', 'SELECT 1');
PREPARE stmt_old FROM @sqlstmt_old;
EXECUTE stmt_old;
DEALLOCATE PREPARE stmt_old;

SET @exist_new := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'conversations' AND index_name = 'uq_farmer_buyer');
SET @sqlstmt_new := IF(@exist_new = 0, 'ALTER TABLE conversations ADD CONSTRAINT uq_farmer_buyer UNIQUE (farmer_user_id, buyer_user_id)', 'SELECT 1');
PREPARE stmt_new FROM @sqlstmt_new;
EXECUTE stmt_new;
DEALLOCATE PREPARE stmt_new;

-- 3. Add columns to chat_messages safely if missing
SET @col_msg_listing := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'chat_messages' AND column_name = 'listing_id');
SET @sql_msg_listing := IF(@col_msg_listing = 0, 'ALTER TABLE chat_messages ADD COLUMN listing_id BIGINT UNSIGNED NULL AFTER recipient_user_id', 'SELECT 1');
PREPARE stmt_ml FROM @sql_msg_listing;
EXECUTE stmt_ml;
DEALLOCATE PREPARE stmt_ml;

SET @col_msg_crop := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'chat_messages' AND column_name = 'crop_name');
SET @sql_msg_crop := IF(@col_msg_crop = 0, 'ALTER TABLE chat_messages ADD COLUMN crop_name VARCHAR(100) NULL AFTER listing_id', 'SELECT 1');
PREPARE stmt_mc FROM @sql_msg_crop;
EXECUTE stmt_mc;
DEALLOCATE PREPARE stmt_mc;

SET @col_msg_var := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'chat_messages' AND column_name = 'variety_name');
SET @sql_msg_var := IF(@col_msg_var = 0, 'ALTER TABLE chat_messages ADD COLUMN variety_name VARCHAR(100) NULL AFTER crop_name', 'SELECT 1');
PREPARE stmt_mv FROM @sql_msg_var;
EXECUTE stmt_mv;
DEALLOCATE PREPARE stmt_mv;

SET @col_msg_pr := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'chat_messages' AND column_name = 'purchase_request_id');
SET @sql_msg_pr := IF(@col_msg_pr = 0, 'ALTER TABLE chat_messages ADD COLUMN purchase_request_id BIGINT UNSIGNED NULL AFTER variety_name', 'SELECT 1');
PREPARE stmt_mpr FROM @sql_msg_pr;
EXECUTE stmt_mpr;
DEALLOCATE PREPARE stmt_mpr;

-- 4. Add conversation_id to purchase_requests safely if missing
SET @col_pr_conv := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'purchase_requests' AND column_name = 'conversation_id');
SET @sql_pr_conv := IF(@col_pr_conv = 0, 'ALTER TABLE purchase_requests ADD COLUMN conversation_id BIGINT UNSIGNED NULL AFTER request_public_id', 'SELECT 1');
PREPARE stmt_prc FROM @sql_pr_conv;
EXECUTE stmt_prc;
DEALLOCATE PREPARE stmt_prc;

-- 5. Modify notifications table column
ALTER TABLE notifications MODIFY COLUMN notification_type VARCHAR(60) NOT NULL;

-- 6. Add performance indexes safely if missing
SET @idx_notif := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'notifications' AND index_name = 'idx_notif_user_unread');
SET @sql_idx_notif := IF(@idx_notif = 0, 'CREATE INDEX idx_notif_user_unread ON notifications (user_id, read_at, created_at DESC)', 'SELECT 1');
PREPARE stmt_in FROM @sql_idx_notif;
EXECUTE stmt_in;
DEALLOCATE PREPARE stmt_in;

SET @idx_msg_asc := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'chat_messages' AND index_name = 'idx_chat_messages_conv_asc');
SET @sql_idx_msg_asc := IF(@idx_msg_asc = 0, 'CREATE INDEX idx_chat_messages_conv_asc ON chat_messages (conversation_id, sent_at ASC, id ASC)', 'SELECT 1');
PREPARE stmt_im FROM @sql_idx_msg_asc;
EXECUTE stmt_im;
DEALLOCATE PREPARE stmt_im;

SET @idx_prc := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'purchase_requests' AND index_name = 'idx_pr_conv');
SET @sql_idx_prc := IF(@idx_prc = 0, 'CREATE INDEX idx_pr_conv ON purchase_requests (conversation_id)', 'SELECT 1');
PREPARE stmt_ip FROM @sql_idx_prc;
EXECUTE stmt_ip;
DEALLOCATE PREPARE stmt_ip;

SET FOREIGN_KEY_CHECKS = 1;
