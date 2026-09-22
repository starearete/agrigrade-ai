-- ============================================================================
-- V23: Consolidate to single platform administrator (starearete@gmail.com)
-- Strip ADMIN role from ALL other users; deactivate test/system admin accounts
-- ============================================================================

-- 1. Strip ADMIN role from every user EXCEPT starearete@gmail.com
DELETE ur
FROM `user_roles` ur
JOIN `users` u  ON ur.user_id  = u.id
JOIN `roles` r  ON ur.role_id  = r.id
WHERE r.code = 'ADMIN'
  AND u.email != 'starearete@gmail.com';

-- 2. Deactivate all stale system admin accounts (admin_*@agrigrade.ai, admin@agrigrade.com)
UPDATE `users`
SET    `status`    = 'DEACTIVATED',
       `updated_at` = NOW()
WHERE  `email` LIKE 'admin_%@agrigrade.ai'
   OR  `email` = 'admin@agrigrade.com';

-- 3. Ensure starearete@gmail.com is ACTIVE with ADMIN role
UPDATE `users`
SET    `status`           = 'ACTIVE',
       `profile_completed` = TRUE,
       `updated_at`       = NOW()
WHERE  `email` = 'starearete@gmail.com';

INSERT INTO `roles` (`code`, `name`, `description`)
VALUES ('ADMIN', 'Platform Administrator', 'System governor, taxonomy manager, audit reviewer')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT IGNORE INTO `user_roles` (`user_id`, `role_id`, `assigned_at`)
SELECT u.id, r.id, NOW()
FROM   `users` u
JOIN   `roles` r ON r.code = 'ADMIN'
WHERE  u.email = 'starearete@gmail.com';
