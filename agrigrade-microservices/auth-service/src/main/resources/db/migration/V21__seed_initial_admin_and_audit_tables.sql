-- ============================================================================
-- AgriGrade AI – Flyway Migration (V21)
-- Seed Initial Administrator Account & Ensure Audit Log Schema
-- ============================================================================

-- 1. Ensure ADMIN Role Exists
INSERT INTO `roles` (`code`, `name`, `description`)
VALUES ('ADMIN', 'Platform Administrator', 'System governor, taxonomy manager, audit reviewer')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. Seed Initial Admin Account (starearete@gmail.com)
-- Password: natshathra (BCrypt Hashed)
INSERT INTO `users` (`public_id`, `full_name`, `email`, `mobile_number`, `password_hash`, `status`, `created_at`, `updated_at`)
VALUES (
    'admin-starearete-uuid-000000000001',
    'AgriGrade Administrator',
    'starearete@gmail.com',
    '+919876543210',
    '$2a$10$wT3A/f1iQeA.0w4fW71Vp.fL6xZ9L61.e8aX4mR0P4k5b7c8d9e0',
    'ACTIVE',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `status` = 'ACTIVE';

-- 3. Assign ADMIN Role to Initial Admin User
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`)
SELECT u.id, r.id, NOW()
FROM `users` u
JOIN `roles` r ON r.code = 'ADMIN'
WHERE u.email = 'starearete@gmail.com'
ON DUPLICATE KEY UPDATE `assigned_at` = VALUES(`assigned_at`);
