-- ============================================================================
-- AgriGrade AI – Schema Enhancement Migration (V2)
-- Refresh Token Family Rotation & Batch Media Metadata Capabilities
-- ============================================================================

-- 1. Refresh Tokens Enhancements for Security Rotation & Reuse Detection
ALTER TABLE `refresh_tokens`
  ADD COLUMN `family_id` CHAR(36) NULL AFTER `token_hash`,
  ADD COLUMN `revoked_at` DATETIME NULL AFTER `is_revoked`,
  ADD COLUMN `replaced_by_token_id` BIGINT UNSIGNED NULL AFTER `revoked_at`,
  ADD CONSTRAINT `fk_rt_replaced_by` FOREIGN KEY (`replaced_by_token_id`) REFERENCES `refresh_tokens` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Batch Media Enhancements (Support up to 10 Photos and 1 Video per Batch)
ALTER TABLE `batch_images`
  ADD COLUMN `media_type` ENUM('PHOTO', 'VIDEO') NOT NULL DEFAULT 'PHOTO' AFTER `batch_id`,
  ADD COLUMN `mime_type` VARCHAR(50) NOT NULL DEFAULT 'image/jpeg' AFTER `media_type`,
  ADD COLUMN `file_size_bytes` BIGINT NOT NULL DEFAULT 0 AFTER `mime_type`;
