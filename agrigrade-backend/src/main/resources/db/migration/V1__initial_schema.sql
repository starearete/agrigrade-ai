-- ============================================================================
-- AgriGrade AI – Perfectly Normalized MySQL 8.x Production Database DDL
-- Database: agrigrade_ai
-- Engine: InnoDB
-- Charset: utf8mb4 / utf8mb4_0900_ai_ci
-- ============================================================================

-- CREATE DATABASE IF NOT EXISTS `agrigrade_ai`
--   DEFAULT CHARACTER SET utf8mb4
--   DEFAULT COLLATE utf8mb4_0900_ai_ci;

-- USE `agrigrade_ai`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. AUTHENTICATION & IDENTITY SCHEMAS
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `otp_verifications`;
DROP TABLE IF EXISTS `user_verifications`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `public_id` CHAR(36) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `mobile_number` VARCHAR(20) DEFAULT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_public_id` (`public_id`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_mobile` (`mobile_number`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(30) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_code` (`code`),
  UNIQUE KEY `uk_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_roles` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role_id` BIGINT UNSIGNED NOT NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `role_id`),
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_verifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `verification_type` ENUM('EMAIL', 'MOBILE', 'IDENTITY_AADHAAR', 'BUSINESS_GST') NOT NULL,
  `status` ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
  `verified_at` DATETIME DEFAULT NULL,
  `details_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_uv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `otp_verifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `target_destination` VARCHAR(255) NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL,
  `purpose` ENUM('REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'TRANSACTION') NOT NULL,
  `attempt_count` INT NOT NULL DEFAULT 0,
  `expires_at` DATETIME NOT NULL,
  `consumed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_otp_target_purpose` (`target_destination`, `purpose`),
  CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `refresh_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `device_info` VARCHAR(255) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `is_revoked` TINYINT(1) NOT NULL DEFAULT 0,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refresh_token_hash` (`token_hash`),
  CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ----------------------------------------------------------------------------
-- 2. PROFILE & LOCATION SCHEMAS
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS `farms`;
DROP TABLE IF EXISTS `farmer_profiles`;
DROP TABLE IF EXISTS `buyer_profiles`;
DROP TABLE IF EXISTS `addresses`;

CREATE TABLE `addresses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `address_type` ENUM('FARM', 'BUSINESS', 'BILLING', 'SHIPPING', 'RESIDENTIAL') NOT NULL,
  `address_line1` VARCHAR(255) NOT NULL,
  `address_line2` VARCHAR(255) DEFAULT NULL,
  `locality` VARCHAR(150) DEFAULT NULL,
  `district` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL DEFAULT 'Tamil Nadu',
  `pincode` VARCHAR(10) NOT NULL,
  `latitude` DECIMAL(10,8) DEFAULT NULL,
  `longitude` DECIMAL(11,8) DEFAULT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_addr_lat_lng` (`latitude`, `longitude`),
  INDEX `idx_addr_district` (`district`),
  CONSTRAINT `fk_addr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `farmer_profiles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `farmer_code` VARCHAR(50) NOT NULL,
  `kisan_credit_card_no` VARCHAR(50) DEFAULT NULL,
  `primary_address_id` BIGINT UNSIGNED DEFAULT NULL,
  `total_land_acres` DECIMAL(8,2) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fp_user` (`user_id`),
  UNIQUE KEY `uk_fp_code` (`farmer_code`),
  CONSTRAINT `fk_fp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_fp_address` FOREIGN KEY (`primary_address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `buyer_profiles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `buyer_code` VARCHAR(50) NOT NULL,
  `business_name` VARCHAR(200) NOT NULL,
  `gst_number` VARCHAR(15) DEFAULT NULL,
  `buyer_type` ENUM('WHOLESALER', 'RETAILER', 'EXPORTER', 'PROCESSOR', 'INDIVIDUAL') NOT NULL,
  `primary_address_id` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bp_user` (`user_id`),
  UNIQUE KEY `uk_bp_code` (`buyer_code`),
  UNIQUE KEY `uk_bp_gst` (`gst_number`),
  CONSTRAINT `fk_bp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bp_address` FOREIGN KEY (`primary_address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `farms` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `farmer_id` BIGINT UNSIGNED NOT NULL,
  `farm_name` VARCHAR(150) NOT NULL,
  `area_acres` DECIMAL(8,2) NOT NULL,
  `address_id` BIGINT UNSIGNED NOT NULL,
  `soil_type` VARCHAR(100) DEFAULT NULL,
  `irrigation_type` VARCHAR(100) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_farm_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_farm_address` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ----------------------------------------------------------------------------
-- 3. CROP & VARIETY MASTER TAXONOMY
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS `disease_recommendations`;
DROP TABLE IF EXISTS `disease_crop_map`;
DROP TABLE IF EXISTS `diseases`;
DROP TABLE IF EXISTS `crop_shelf_life_rules`;
DROP TABLE IF EXISTS `crop_grade_rules`;
DROP TABLE IF EXISTS `crop_aliases`;
DROP TABLE IF EXISTS `crop_varieties`;
DROP TABLE IF EXISTS `crops`;
DROP TABLE IF EXISTS `crop_categories`;

CREATE TABLE `crop_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(30) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cc_code` (`code`),
  UNIQUE KEY `uk_cc_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `crops` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `scientific_name` VARCHAR(180) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_crop_code` (`code`),
  UNIQUE KEY `uk_crop_name` (`name`),
  CONSTRAINT `fk_crop_category` FOREIGN KEY (`category_id`) REFERENCES `crop_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `crop_varieties` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `crop_id` BIGINT UNSIGNED NOT NULL,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `scientific_name` VARCHAR(180) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cv_crop_name` (`crop_id`, `name`),
  UNIQUE KEY `uk_cv_crop_code` (`crop_id`, `code`),
  INDEX `idx_cv_crop_active` (`crop_id`, `is_active`),
  CONSTRAINT `fk_cv_crop` FOREIGN KEY (`crop_id`) REFERENCES `crops` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `crop_aliases` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `variety_id` BIGINT UNSIGNED NOT NULL,
  `language_code` VARCHAR(10) NOT NULL,
  `alias_name` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ca_variety_lang_alias` (`variety_id`, `language_code`, `alias_name`),
  INDEX `idx_ca_search` (`alias_name`, `language_code`),
  CONSTRAINT `fk_ca_variety` FOREIGN KEY (`variety_id`) REFERENCES `crop_varieties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `crop_grade_rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `variety_id` BIGINT UNSIGNED NOT NULL,
  `grade_code` VARCHAR(20) NOT NULL,
  `min_quality_score` DECIMAL(5,2) NOT NULL,
  `max_defect_percent` DECIMAL(5,2) NOT NULL,
  `min_size_mm` DECIMAL(8,2) DEFAULT NULL,
  `max_size_mm` DECIMAL(8,2) DEFAULT NULL,
  `min_weight_g` DECIMAL(8,2) DEFAULT NULL,
  `max_weight_g` DECIMAL(8,2) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cgr_variety_grade` (`variety_id`, `grade_code`),
  CONSTRAINT `fk_cgr_variety` FOREIGN KEY (`variety_id`) REFERENCES `crop_varieties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `crop_shelf_life_rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `variety_id` BIGINT UNSIGNED NOT NULL,
  `storage_condition` ENUM('AMBIENT', 'COLD_STORAGE', 'REFRIGERATED', 'CONTROLLED_ATMOSPHERE') NOT NULL DEFAULT 'AMBIENT',
  `max_shelf_life_days` DECIMAL(5,2) NOT NULL,
  `daily_degradation_factor` DECIMAL(5,4) NOT NULL DEFAULT 1.0000,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cslr_variety_storage` (`variety_id`, `storage_condition`),
  CONSTRAINT `fk_cslr_variety` FOREIGN KEY (`variety_id`) REFERENCES `crop_varieties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `diseases` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `scientific_name` VARCHAR(180) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `severity_level` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dis_code` (`code`),
  UNIQUE KEY `uk_dis_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `disease_crop_map` (
  `disease_id` BIGINT UNSIGNED NOT NULL,
  `crop_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`disease_id`, `crop_id`),
  CONSTRAINT `fk_dcm_disease` FOREIGN KEY (`disease_id`) REFERENCES `diseases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dcm_crop` FOREIGN KEY (`crop_id`) REFERENCES `crops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `disease_recommendations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `disease_id` BIGINT UNSIGNED NOT NULL,
  `prevention_text` TEXT DEFAULT NULL,
  `treatment_text` TEXT DEFAULT NULL,
  `recommended_pesticides` TEXT DEFAULT NULL,
  `organic_remedy` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dr_disease` FOREIGN KEY (`disease_id`) REFERENCES `diseases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ----------------------------------------------------------------------------
-- 4. AI MODELS & MARKETS TAXONOMY
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS `transport_estimates`;
DROP TABLE IF EXISTS `market_rates`;
DROP TABLE IF EXISTS `markets`;
DROP TABLE IF EXISTS `ai_models`;

CREATE TABLE `ai_models` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `model_code` VARCHAR(50) NOT NULL,
  `model_name` VARCHAR(100) NOT NULL,
  `version` VARCHAR(30) NOT NULL,
  `model_type` ENUM('QUALITY_GRADING', 'DISEASE_DETECTION', 'DEFECT_SEGMENTATION', 'SHELF_LIFE_PREDICTION', 'PRICE_FORECAST') NOT NULL,
  `accuracy_score` DECIMAL(5,4) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `deployed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_aim_code` (`model_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `markets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `market_type` ENUM('MANDI', 'WHOLESALE_HUB', 'FARMER_MARKET', 'DIRECT_BUYER_HUB') NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL DEFAULT 'Tamil Nadu',
  `address_line` VARCHAR(255) DEFAULT NULL,
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL,
  `contact_person` VARCHAR(100) DEFAULT NULL,
  `contact_phone` VARCHAR(20) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_market_code` (`code`),
  INDEX `idx_market_location` (`latitude`, `longitude`),
  INDEX `idx_market_district` (`district`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `market_rates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `market_id` BIGINT UNSIGNED NOT NULL,
  `variety_id` BIGINT UNSIGNED NOT NULL,
  `min_price_per_kg` DECIMAL(12,2) NOT NULL,
  `max_price_per_kg` DECIMAL(12,2) NOT NULL,
  `modal_price_per_kg` DECIMAL(12,2) NOT NULL,
  `quantity_arrived_tons` DECIMAL(10,2) DEFAULT NULL,
  `observed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_mr_variety_market_time` (`variety_id`, `market_id`, `observed_at`),
  CONSTRAINT `fk_mr_market` FOREIGN KEY (`market_id`) REFERENCES `markets` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mr_variety` FOREIGN KEY (`variety_id`) REFERENCES `crop_varieties` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `transport_estimates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `origin_address_id` BIGINT UNSIGNED NOT NULL,
  `destination_market_id` BIGINT UNSIGNED NOT NULL,
  `distance_km` DECIMAL(8,2) NOT NULL,
  `estimated_travel_minutes` INT NOT NULL,
  `estimated_cost` DECIMAL(12,2) NOT NULL,
  `vehicle_type` VARCHAR(50) NOT NULL DEFAULT 'MINI_TRUCK',
  `calculated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_te_origin` FOREIGN KEY (`origin_address_id`) REFERENCES `addresses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_te_market` FOREIGN KEY (`destination_market_id`) REFERENCES `markets` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ----------------------------------------------------------------------------
-- 5. BATCHES & AI ANALYSIS PIPELINE
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS `ai_certificates`;
DROP TABLE IF EXISTS `market_recommendations`;
DROP TABLE IF EXISTS `price_predictions`;
DROP TABLE IF EXISTS `shelf_life_predictions`;
DROP TABLE IF EXISTS `disease_findings`;
DROP TABLE IF EXISTS `disease_analyses`;
DROP TABLE IF EXISTS `defect_results`;
DROP TABLE IF EXISTS `quality_results`;
DROP TABLE IF EXISTS `ai_analyses`;
DROP TABLE IF EXISTS `batch_images`;
DROP TABLE IF EXISTS `product_batches`;

CREATE TABLE `product_batches` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_number` VARCHAR(50) NOT NULL,
  `farmer_id` BIGINT UNSIGNED NOT NULL,
  `variety_id` BIGINT UNSIGNED NOT NULL,
  `harvest_date` DATE NOT NULL,
  `quantity` DECIMAL(12,3) NOT NULL,
  `quantity_unit` VARCHAR(20) NOT NULL DEFAULT 'KG',
  `harvest_location_id` BIGINT UNSIGNED NOT NULL,
  `storage_condition` ENUM('AMBIENT', 'COLD_STORAGE', 'REFRIGERATED', 'CONTROLLED_ATMOSPHERE') NOT NULL DEFAULT 'AMBIENT',
  `status` ENUM('HARVESTED', 'ANALYZED', 'LISTED', 'PARTIALLY_SOLD', 'SOLD', 'EXPIRED', 'DELISTED') NOT NULL DEFAULT 'HARVESTED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pb_batch_number` (`batch_number`),
  INDEX `idx_pb_farmer_date` (`farmer_id`, `harvest_date`),
  INDEX `idx_pb_variety_status` (`variety_id`, `status`),
  CONSTRAINT `fk_pb_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer_profiles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pb_variety` FOREIGN KEY (`variety_id`) REFERENCES `crop_varieties` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pb_location` FOREIGN KEY (`harvest_location_id`) REFERENCES `addresses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `batch_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `storage_key` VARCHAR(500) NOT NULL,
  `sequence_no` INT NOT NULL,
  `sha256_hash` CHAR(64) NOT NULL,
  `captured_at` DATETIME DEFAULT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bi_batch_seq` (`batch_id`, `sequence_no`),
  CONSTRAINT `fk_bi_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `ai_analyses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `model_id` BIGINT UNSIGNED NOT NULL,
  `analysis_type` ENUM('QUALITY_GRADING', 'DISEASE_DETECTION', 'FULL_INSPECTION') NOT NULL,
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` DATETIME DEFAULT NULL,
  `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `overall_confidence` DECIMAL(5,2) DEFAULT NULL,
  `rejection_reason` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_aia_batch_started` (`batch_id`, `started_at`),
  CONSTRAINT `fk_aia_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_aia_model` FOREIGN KEY (`model_id`) REFERENCES `ai_models` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `quality_results` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `analysis_id` BIGINT UNSIGNED NOT NULL,
  `assigned_grade` ENUM('GRADE_A_PREMIUM', 'GRADE_B_STANDARD', 'GRADE_C_COMMERCIAL', 'REJECTED') NOT NULL,
  `quality_score` DECIMAL(5,2) NOT NULL,
  `moisture_percent` DECIMAL(6,3) DEFAULT NULL,
  `uniformity_score` DECIMAL(5,2) DEFAULT NULL,
  `color_purity_score` DECIMAL(5,2) DEFAULT NULL,
  `calculated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_qr_analysis` (`analysis_id`),
  INDEX `idx_qr_grade` (`assigned_grade`),
  CONSTRAINT `fk_qr_analysis` FOREIGN KEY (`analysis_id`) REFERENCES `ai_analyses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `defect_results` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quality_result_id` BIGINT UNSIGNED NOT NULL,
  `defect_type` VARCHAR(100) NOT NULL,
  `severity_score` DECIMAL(5,2) NOT NULL,
  `affected_percent` DECIMAL(6,3) DEFAULT NULL,
  `count_detected` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dr_quality_result` FOREIGN KEY (`quality_result_id`) REFERENCES `quality_results` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `disease_analyses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `analysis_id` BIGINT UNSIGNED NOT NULL,
  `overall_disease_risk` ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
  `evaluated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_da_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_da_analysis` FOREIGN KEY (`analysis_id`) REFERENCES `ai_analyses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `disease_findings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `disease_analysis_id` BIGINT UNSIGNED NOT NULL,
  `disease_id` BIGINT UNSIGNED NOT NULL,
  `confidence_score` DECIMAL(5,2) NOT NULL,
  `severity_percent` DECIMAL(5,2) NOT NULL,
  `affected_area_sqcm` DECIMAL(8,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_df_disease_analysis` FOREIGN KEY (`disease_analysis_id`) REFERENCES `disease_analyses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_df_disease` FOREIGN KEY (`disease_id`) REFERENCES `diseases` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `shelf_life_predictions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `analysis_id` BIGINT UNSIGNED NOT NULL,
  `calculated_on` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estimated_remaining_days` DECIMAL(7,2) NOT NULL,
  `estimated_expiry_date` DATE NOT NULL,
  `confidence` DECIMAL(5,2) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_slp_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_slp_analysis` FOREIGN KEY (`analysis_id`) REFERENCES `ai_analyses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `price_predictions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `analysis_id` BIGINT UNSIGNED NOT NULL,
  `predicted_price_per_kg` DECIMAL(12,2) NOT NULL,
  `price_range_low` DECIMAL(12,2) NOT NULL,
  `price_range_high` DECIMAL(12,2) NOT NULL,
  `calculated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pp_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pp_analysis` FOREIGN KEY (`analysis_id`) REFERENCES `ai_analyses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `market_recommendations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `market_id` BIGINT UNSIGNED NOT NULL,
  `current_market_price_per_kg` DECIMAL(12,2) NOT NULL,
  `distance_km` DECIMAL(8,2) NOT NULL,
  `estimated_transport_cost` DECIMAL(12,2) NOT NULL,
  `estimated_net_revenue` DECIMAL(12,2) NOT NULL,
  `recommendation_score` DECIMAL(5,2) NOT NULL,
  `rank_order` INT NOT NULL,
  `generated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mr_rec_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mr_rec_market` FOREIGN KEY (`market_id`) REFERENCES `markets` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `ai_certificates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `certificate_number` VARCHAR(60) NOT NULL,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `quality_result_id` BIGINT UNSIGNED NOT NULL,
  `model_id` BIGINT UNSIGNED NOT NULL,
  `digital_signature` CHAR(64) NOT NULL,
  `certificate_pdf_url` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('ISSUED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ISSUED',
  `issued_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_aic_number` (`certificate_number`),
  UNIQUE KEY `uk_aic_batch` (`batch_id`),
  CONSTRAINT `fk_aic_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_aic_quality` FOREIGN KEY (`quality_result_id`) REFERENCES `quality_results` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_aic_model` FOREIGN KEY (`model_id`) REFERENCES `ai_models` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ----------------------------------------------------------------------------
-- 6. MARKETPLACE & TRADE SCHEMAS
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS `order_status_history`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `message_attachments`;
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `conversation_participants`;
DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `buyer_inquiries`;
DROP TABLE IF EXISTS `buyer_favorites`;
DROP TABLE IF EXISTS `listing_visibility`;
DROP TABLE IF EXISTS `marketplace_listings`;

CREATE TABLE `marketplace_listings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `listing_code` VARCHAR(60) NOT NULL,
  `asking_price_per_unit` DECIMAL(12,2) NOT NULL,
  `minimum_order_quantity` DECIMAL(12,3) NOT NULL,
  `quantity_remaining` DECIMAL(12,3) NOT NULL,
  `listed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  `status` ENUM('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'SOLD_OUT', 'SUSPENDED', 'WITHDRAWN') NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mpl_batch` (`batch_id`),
  UNIQUE KEY `uk_mpl_code` (`listing_code`),
  INDEX `idx_mpl_status_expiry` (`status`, `expires_at`),
  CONSTRAINT `fk_mpl_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `listing_visibility` (
  `listing_id` BIGINT UNSIGNED NOT NULL,
  `is_public` TINYINT(1) NOT NULL DEFAULT 1,
  `allow_direct_offers` TINYINT(1) NOT NULL DEFAULT 1,
  `show_farmer_phone` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`listing_id`),
  CONSTRAINT `fk_lv_listing` FOREIGN KEY (`listing_id`) REFERENCES `marketplace_listings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `buyer_favorites` (
  `buyer_id` BIGINT UNSIGNED NOT NULL,
  `listing_id` BIGINT UNSIGNED NOT NULL,
  `saved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`buyer_id`, `listing_id`),
  CONSTRAINT `fk_bf_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `buyer_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bf_listing` FOREIGN KEY (`listing_id`) REFERENCES `marketplace_listings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `buyer_inquiries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `listing_id` BIGINT UNSIGNED NOT NULL,
  `buyer_id` BIGINT UNSIGNED NOT NULL,
  `offered_price_per_unit` DECIMAL(12,2) NOT NULL,
  `requested_quantity` DECIMAL(12,3) NOT NULL,
  `message` TEXT DEFAULT NULL,
  `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'NEGOTIATING', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_bi_listing_buyer_status` (`listing_id`, `buyer_id`, `status`),
  CONSTRAINT `fk_bi_listing` FOREIGN KEY (`listing_id`) REFERENCES `marketplace_listings` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bi_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `buyer_profiles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `listing_id` BIGINT UNSIGNED DEFAULT NULL,
  `inquiry_id` BIGINT UNSIGNED DEFAULT NULL,
  `conversation_type` ENUM('INQUIRY_NEGOTIATION', 'DIRECT_SUPPORT', 'ORDER_FULFILLMENT') NOT NULL DEFAULT 'INQUIRY_NEGOTIATION',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_conv_listing` FOREIGN KEY (`listing_id`) REFERENCES `marketplace_listings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_conv_inquiry` FOREIGN KEY (`inquiry_id`) REFERENCES `buyer_inquiries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `conversation_participants` (
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_read_message_id` BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`conversation_id`, `user_id`),
  INDEX `idx_cp_user_conv` (`user_id`, `conversation_id`),
  CONSTRAINT `fk_cp_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `sender_id` BIGINT UNSIGNED NOT NULL,
  `message_text` TEXT DEFAULT NULL,
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `edited_at` DATETIME DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_cm_conv_sent` (`conversation_id`, `sent_at`),
  CONSTRAINT `fk_cm_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cm_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `message_attachments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `message_id` BIGINT UNSIGNED NOT NULL,
  `file_key` VARCHAR(500) NOT NULL,
  `file_type` VARCHAR(50) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_size_bytes` BIGINT NOT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ma_message` FOREIGN KEY (`message_id`) REFERENCES `chat_messages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(60) NOT NULL,
  `listing_id` BIGINT UNSIGNED NOT NULL,
  `buyer_id` BIGINT UNSIGNED NOT NULL,
  `farmer_id` BIGINT UNSIGNED NOT NULL,
  `agreed_price_per_unit` DECIMAL(12,2) NOT NULL,
  `quantity` DECIMAL(12,3) NOT NULL,
  `total_amount` DECIMAL(14,2) NOT NULL,
  `status` ENUM('AGREED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED') NOT NULL DEFAULT 'AGREED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ord_number` (`order_number`),
  CONSTRAINT `fk_ord_listing` FOREIGN KEY (`listing_id`) REFERENCES `marketplace_listings` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ord_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `buyer_profiles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ord_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer_profiles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `order_status_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('AGREED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED') NOT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  `changed_by_user_id` BIGINT UNSIGNED NOT NULL,
  `changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_osh_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ----------------------------------------------------------------------------
-- 7. GOVERNANCE & AUDIT SCHEMAS
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS `admin_actions`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `notification_preferences`;
DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `body` TEXT NOT NULL,
  `notification_type` ENUM('AI_ANALYSIS_COMPLETE', 'MARKET_ALERT', 'BUYER_INQUIRY', 'CHAT_MESSAGE', 'ORDER_UPDATE', 'SYSTEM') NOT NULL,
  `reference_type` VARCHAR(50) DEFAULT NULL,
  `reference_id` BIGINT UNSIGNED DEFAULT NULL,
  `read_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_notif_user_read` (`user_id`, `read_at`, `created_at`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `notification_preferences` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `email_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sms_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `push_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `market_alerts_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_np_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `reports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_code` VARCHAR(60) NOT NULL,
  `generated_by_user_id` BIGINT UNSIGNED NOT NULL,
  `report_type` ENUM('FARMER_SALES', 'BUYER_PURCHASES', 'AI_ACCURACY', 'MARKET_PRICE_TRENDS', 'ADMIN_AUDIT') NOT NULL,
  `parameter_json` JSON DEFAULT NULL,
  `download_url` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rep_code` (`report_code`),
  CONSTRAINT `fk_rep_user` FOREIGN KEY (`generated_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `entity_name` VARCHAR(100) NOT NULL,
  `entity_id` BIGINT UNSIGNED DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `payload_json` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_al_actor_created` (`actor_user_id`, `created_at`),
  CONSTRAINT `fk_al_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `admin_actions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NOT NULL,
  `target_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `action_code` VARCHAR(100) NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `executed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_aa_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_aa_target` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================================
-- INITIAL MASTER DATA SEEDING (TAMIL NADU SPECIFIC CATALOG)
-- ============================================================================

-- Roles
INSERT INTO `roles` (`code`, `name`, `description`) VALUES
('FARMER', 'Farmer User', 'Harvest producer, AI batch analysis requester & seller'),
('BUYER', 'Buyer User', 'Wholesaler, retailer, exporter, or direct crop buyer'),
('ADMIN', 'Platform Administrator', 'System governor, taxonomy manager, audit reviewer');

-- Crop Categories
INSERT INTO `crop_categories` (`code`, `name`, `description`) VALUES
('FRUITS', 'Fruits', 'Fresh fruits cultivated in Tamil Nadu region'),
('VEGETABLES', 'Vegetables', 'Fresh green and field vegetables'),
('TUBERS', 'Root & Tuber Vegetables', 'Underground roots, tubers and bulbs');

-- Crops
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`) VALUES
(1, 'BANANA', 'Banana', 'Musa acuminata'),
(1, 'MANGO', 'Mango', 'Mangifera indica'),
(2, 'TOMATO', 'Tomato', 'Solanum lycopersicum'),
(3, 'ONION', 'Onion', 'Allium cepa'),
(2, 'BRINJAL', 'Brinjal / Eggplant', 'Solanum melongena'),
(2, 'BHENDI', 'Bhendi / Okra', 'Abelmoschus esculentus'),
(2, 'CHILLI', 'Green Chilli', 'Capsicum annuum'),
(2, 'DRUMSTICK', 'Drumstick / Moringa', 'Moringa oleifera'),
(2, 'GOURDS', 'Gourds (Bottle/Bitter/Snake)', 'Cucurbitaceae family'),
(3, 'TUBERS', 'Roots & Tubers (Carrot/Beetroot/Tapioca)', 'Various root crops');

-- Varieties for Banana (TN varieties)
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`) VALUES
(1, 'BANANA_G9', 'G9 / Grand Naine', 'Musa acuminata Grand Naine'),
(1, 'BANANA_NENDRAN', 'Nendran', 'Musa AAB Nendran'),
(1, 'BANANA_POOVAN', 'Poovan', 'Musa AAB Poovan'),
(1, 'BANANA_RASTHALI', 'Rasthali', 'Musa AAB Rasthali'),
(1, 'BANANA_ROBUSTA', 'Robusta', 'Musa AAA Robusta'),
(1, 'BANANA_RED', 'Red Banana', 'Musa AAA Red Banana'),
(1, 'BANANA_KARPOORAVALLI', 'Karpooravalli', 'Musa ABB Karpooravalli'),
(1, 'BANANA_NEY_POOVAN', 'Ney Poovan', 'Musa AB Ney Poovan'),
(1, 'BANANA_MONTHAN', 'Monthan', 'Musa ABB Monthan'),
(1, 'BANANA_VAYAL_VAZHAI', 'Vayal Vazhai', 'Musa local TN'),
(1, 'BANANA_SIRUMALAI', 'Sirumalai', 'Musa Hill Banana'),
(1, 'BANANA_VIRUPAKSHI', 'Virupakshi', 'Musa Hill Banana Virupakshi'),
(1, 'BANANA_MATTI', 'Matti', 'Musa Matti TN'),
(1, 'BANANA_UDHAYAM', 'Udhayam', 'Musa Udhayam TNAU'),
(1, 'BANANA_CO1', 'CO-1', 'Musa Hybrid CO-1 TNAU'),
(1, 'BANANA_MANORANJITHAM', 'Manoranjitham', 'Musa Manoranjitham'),
(1, 'BANANA_LADAN', 'Ladan', 'Musa Ladan');

-- Varieties for Mango
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`) VALUES
(2, 'MANGO_BANGANAPALLI', 'Banganapalli', 'Mangifera indica Banganapalli'),
(2, 'MANGO_NEELUM', 'Neelum', 'Mangifera indica Neelum'),
(2, 'MANGO_TOTAPURI', 'Totapuri / Bangalora', 'Mangifera indica Totapuri'),
(2, 'MANGO_ALPHONSO', 'Alphonso', 'Mangifera indica Alphonso'),
(2, 'MANGO_RUMANI', 'Rumani', 'Mangifera indica Rumani'),
(2, 'MANGO_MALLIKA', 'Mallika', 'Mangifera indica Mallika');

-- Varieties for Tomato
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`) VALUES
(3, 'TOMATO_CO3', 'CO-3', 'Solanum lycopersicum CO-3 TNAU'),
(3, 'TOMATO_PKM1', 'PKM-1', 'Solanum lycopersicum PKM-1 TNAU'),
(3, 'TOMATO_PAIYUR1', 'Paiyur-1', 'Solanum lycopersicum Paiyur-1'),
(3, 'TOMATO_COTH1', 'COTH-1 Hybrid', 'Solanum lycopersicum COTH-1'),
(3, 'TOMATO_COTH2', 'COTH-2 Hybrid', 'Solanum lycopersicum COTH-2'),
(3, 'TOMATO_CO4', 'CO-4', 'Solanum lycopersicum CO-4');

-- Varieties for Onion
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`) VALUES
(4, 'ONION_BELLARY', 'Big Onion / Bellary', 'Allium cepa Bellary'),
(4, 'ONION_SHALLOT', 'Small Onion / Shallot', 'Allium cepa aggregatum');

-- Variety Aliases (Tamil Local Names)
INSERT INTO `crop_aliases` (`variety_id`, `language_code`, `alias_name`) VALUES
(1, 'ta', 'ஜி9 வாழை / கிராண்ட் நைன்'),
(2, 'ta', 'நேந்திரன் வாழை'),
(3, 'ta', 'பூவன் வாழை'),
(4, 'ta', 'ரஸ்தாளி வாழை'),
(7, 'ta', 'கற்பூரவள்ளி வாழை'),
(8, 'ta', 'நெய் பூவன்'),
(11, 'ta', 'சிறுமலை மலைவாழை'),
(12, 'ta', 'விருப்பாட்சி வாழை'),
(24, 'ta', 'சின்ன வெங்காயம் / சாம்பார் வெங்காயம்'),
(23, 'ta', 'பெரிய வெங்காயம் / பெல்லாரி');

-- AI Models Initial Seed
INSERT INTO `ai_models` (`model_code`, `model_name`, `version`, `model_type`, `accuracy_score`) VALUES
('AGRI_VISION_BANANA_V1', 'AgriGrade Vision Banana Grading', '1.2.0', 'QUALITY_GRADING', 0.9450),
('AGRI_VISION_TOMATO_V1', 'AgriGrade Vision Tomato Quality', '1.1.0', 'QUALITY_GRADING', 0.9380),
('AGRI_DISEASE_TN_V1', 'AgriGrade Leaf & Fruit Disease Net', '2.0.1', 'DISEASE_DETECTION', 0.9620),
('AGRI_SHELF_PRED_V1', 'AgriGrade Shelf Life Estimator', '1.0.0', 'SHELF_LIFE_PREDICTION', 0.9120);

-- Markets Initial Seed (Tamil Nadu Mandis)
INSERT INTO `markets` (`code`, `name`, `market_type`, `district`, `state`, `latitude`, `longitude`) VALUES
('MKT_KOYAMBEDU', 'Koyambedu Wholesale Market Complex', 'WHOLESALE_HUB', 'Chennai', 'Tamil Nadu', 13.06940000, 80.19480000),
('MKT_ODDANCHATRAM', 'Oddanchatram Vegetable Market', 'MANDI', 'Dindigul', 'Tamil Nadu', 10.48510000, 77.74780000),
('MKT_TRICHY_GANDHI', 'Trichy Gandhi Market', 'WHOLESALE_HUB', 'Tiruchirappalli', 'Tamil Nadu', 10.82710000, 78.69720000),
('MKT_MADURAI_MATTUTHAVANI', 'Madurai Mattuthavani Wholesale Market', 'MANDI', 'Madurai', 'Tamil Nadu', 9.94670000, 78.15690000),
('MKT_SALEM_LEIGH', 'Salem Leigh Bazaar', 'MANDI', 'Salem', 'Tamil Nadu', 11.66430000, 78.14600000),
('MKT_COIMBATORE_MGR', 'Coimbatore MGR Wholesale Market', 'MANDI', 'Coimbatore', 'Tamil Nadu', 11.00180000, 76.96290000),
('MKT_THENI_BANANA', 'Theni Banana & Fruit Hub', 'DIRECT_BUYER_HUB', 'Theni', 'Tamil Nadu', 10.01040000, 77.47680000);

-- Sample Market Rates
INSERT INTO `market_rates` (`market_id`, `variety_id`, `min_price_per_kg`, `max_price_per_kg`, `modal_price_per_kg`, `quantity_arrived_tons`) VALUES
(1, 1, 22.00, 28.00, 25.00, 45.50),
(7, 1, 20.00, 26.00, 24.00, 80.00),
(2, 24, 45.00, 60.00, 52.00, 30.00),
(3, 19, 18.00, 25.00, 22.00, 25.00);
