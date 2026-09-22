-- ============================================================================
-- V22: Admin Module — admin_actions audit table ONLY
-- NOTE: Admin account provisioning is handled by AdminInitializerRunner.java
--       which ensures starearete@gmail.com is the sole administrator.
-- ============================================================================

-- Create admin_actions audit trail table (idempotent)
CREATE TABLE IF NOT EXISTS `admin_actions` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id`  BIGINT UNSIGNED NOT NULL,
  `target_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `action_code`    VARCHAR(100) NOT NULL,
  `reason`         VARCHAR(255) NOT NULL DEFAULT 'Admin action',
  `executed_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_aa_admin`  FOREIGN KEY (`admin_user_id`)  REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_aa_target` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_aa_admin`  (`admin_user_id`),
  INDEX `idx_aa_target` (`target_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
