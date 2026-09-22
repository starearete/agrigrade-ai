-- Migration V8: Add Google Authentication support to users table
ALTER TABLE users
ADD COLUMN auth_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL' AFTER password_hash;

ALTER TABLE users
ADD COLUMN google_subject_id VARCHAR(255) NULL AFTER auth_provider;

ALTER TABLE users
ADD COLUMN profile_picture_url VARCHAR(500) NULL AFTER google_subject_id;

-- Add unique constraint on google_subject_id for fast provider resolution
ALTER TABLE users
ADD CONSTRAINT uk_users_google_subject_id UNIQUE (google_subject_id);
