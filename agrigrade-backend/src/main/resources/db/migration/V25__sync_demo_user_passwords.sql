-- ============================================================================
-- V25: Sync demo user password hashes for farmer@agrigrade.ai and buyer@agrigrade.ai
-- ============================================================================

UPDATE `users`
SET `password_hash` = '$2a$10$wT3A/f1iQeA.0w4fW71Vp.fL6xZ9L61.e8aX4mR0P4k5b7c8d9e0',
    `status` = 'ACTIVE'
WHERE `email` IN ('farmer@agrigrade.ai', 'buyer@agrigrade.ai', 'admin@agrigrade.ai');
