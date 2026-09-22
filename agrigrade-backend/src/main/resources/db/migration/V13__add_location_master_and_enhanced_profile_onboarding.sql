-- ============================================================================
-- Flyway Migration V13: Tamil Nadu Location Master & Enhanced Profile Onboarding
-- Database: agrigrade_ai
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. COUNTRIES TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `countries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_countries_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `countries` (`id`, `name`, `code`)
VALUES (1, 'India', 'IN')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`);


-- ----------------------------------------------------------------------------
-- 2. STATES & UNION TERRITORIES TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `states` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `country_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `type` ENUM('STATE', 'UNION_TERRITORY') NOT NULL DEFAULT 'STATE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_states_name` (`country_id`, `name`),
  UNIQUE KEY `uk_states_code` (`country_id`, `code`),
  CONSTRAINT `fk_states_country`
    FOREIGN KEY (`country_id`)
    REFERENCES `countries` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `states` (`id`, `country_id`, `name`, `code`, `type`)
VALUES (1, 1, 'Tamil Nadu', 'TN', 'STATE')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `type` = VALUES(`type`);


-- ----------------------------------------------------------------------------
-- 3. DISTRICTS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `districts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `state_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_districts_name` (`state_id`, `name`),
  CONSTRAINT `fk_districts_state`
    FOREIGN KEY (`state_id`)
    REFERENCES `states` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `districts` (`state_id`, `name`, `code`)
VALUES
(1, 'Ariyalur', 'TN-AR'),
(1, 'Chengalpattu', 'TN-CGL'),
(1, 'Chennai', 'TN-CH'),
(1, 'Coimbatore', 'TN-CO'),
(1, 'Cuddalore', 'TN-CU'),
(1, 'Dharmapuri', 'TN-DH'),
(1, 'Dindigul', 'TN-DI'),
(1, 'Erode', 'TN-ER'),
(1, 'Kallakurichi', 'TN-KL'),
(1, 'Kancheepuram', 'TN-KC'),
(1, 'Karur', 'TN-KR'),
(1, 'Krishnagiri', 'TN-KG'),
(1, 'Madurai', 'TN-MA'),
(1, 'Mayiladuthurai', 'TN-MY'),
(1, 'Nagapattinam', 'TN-NG'),
(1, 'Kanniyakumari', 'TN-KK'),
(1, 'Namakkal', 'TN-NM'),
(1, 'Nilgiris', 'TN-NI'),
(1, 'Perambalur', 'TN-PE'),
(1, 'Pudukkottai', 'TN-PU'),
(1, 'Ramanathapuram', 'TN-RA'),
(1, 'Ranipet', 'TN-RN'),
(1, 'Salem', 'TN-SA'),
(1, 'Sivaganga', 'TN-SI'),
(1, 'Tenkasi', 'TN-TS'),
(1, 'Thanjavur', 'TN-TJ'),
(1, 'Theni', 'TN-TH'),
(1, 'Thoothukudi', 'TN-TK'),
(1, 'Tiruchirappalli', 'TN-TC'),
(1, 'Tirunelveli', 'TN-TI'),
(1, 'Tirupathur', 'TN-TP'),
(1, 'Tiruppur', 'TN-TU'),
(1, 'Tiruvallur', 'TN-TL'),
(1, 'Tiruvannamalai', 'TN-TV'),
(1, 'Tiruvarur', 'TN-TR'),
(1, 'Vellore', 'TN-VE'),
(1, 'Viluppuram', 'TN-VL'),
(1, 'Virudhunagar', 'TN-VR')
ON DUPLICATE KEY UPDATE
  `code` = VALUES(`code`);


-- ----------------------------------------------------------------------------
-- 4. ALTER USERS TABLE FOR ONBOARDING, LANGUAGE & THEME
-- ----------------------------------------------------------------------------

ALTER TABLE `users`
  ADD COLUMN `profile_completed` TINYINT(1) NOT NULL DEFAULT 0
  AFTER `status`;

ALTER TABLE `users`
  ADD COLUMN `preferred_language` VARCHAR(10) NOT NULL DEFAULT 'en'
  AFTER `profile_completed`;

ALTER TABLE `users`
  ADD COLUMN `preferred_theme` VARCHAR(20) NOT NULL DEFAULT 'LIGHT'
  AFTER `preferred_language`;


-- ----------------------------------------------------------------------------
-- 5. ENHANCE ADDRESSES TABLE
-- ----------------------------------------------------------------------------

ALTER TABLE `addresses`
  MODIFY COLUMN `address_type`
  ENUM('CONTACT', 'FARM', 'BUSINESS', 'RESIDENTIAL', 'BILLING', 'SHIPPING')
  NOT NULL DEFAULT 'CONTACT';

ALTER TABLE `addresses`
  ADD COLUMN `village_town_city` VARCHAR(150) DEFAULT NULL
  AFTER `address_line2`;

ALTER TABLE `addresses`
  ADD COLUMN `landmark` VARCHAR(255) DEFAULT NULL
  AFTER `pincode`;

ALTER TABLE `addresses`
  ADD COLUMN `state_id` BIGINT UNSIGNED DEFAULT NULL
  AFTER `district`;

ALTER TABLE `addresses`
  ADD COLUMN `taluk` VARCHAR(150) DEFAULT NULL
  AFTER `village_town_city`;

ALTER TABLE `addresses`
  ADD COLUMN `district_id` BIGINT UNSIGNED DEFAULT NULL
  AFTER `state_id`;

ALTER TABLE `addresses`
  ADD CONSTRAINT `fk_addr_state`
  FOREIGN KEY (`state_id`)
  REFERENCES `states` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE `addresses`
  ADD CONSTRAINT `fk_addr_district`
  FOREIGN KEY (`district_id`)
  REFERENCES `districts` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;


-- ----------------------------------------------------------------------------
-- 6. ENHANCE FARMER PROFILES TABLE
-- ----------------------------------------------------------------------------

ALTER TABLE `farmer_profiles`
  ADD COLUMN `contact_address_id` BIGINT UNSIGNED DEFAULT NULL
  AFTER `kisan_credit_card_no`;

ALTER TABLE `farmer_profiles`
  ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `farmer_profiles`
  ADD COLUMN `farm_address_id` BIGINT UNSIGNED DEFAULT NULL
  AFTER `contact_address_id`;

ALTER TABLE `farmer_profiles`
  ADD COLUMN `farm_same_as_contact` TINYINT(1) NOT NULL DEFAULT 1
  AFTER `farm_address_id`;

ALTER TABLE `farmer_profiles`
  ADD CONSTRAINT `fk_fp_contact_addr`
  FOREIGN KEY (`contact_address_id`)
  REFERENCES `addresses` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE `farmer_profiles`
  ADD CONSTRAINT `fk_fp_farm_addr`
  FOREIGN KEY (`farm_address_id`)
  REFERENCES `addresses` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;


-- ----------------------------------------------------------------------------
-- 7. ENHANCE BUYER PROFILES TABLE
-- ----------------------------------------------------------------------------

ALTER TABLE `buyer_profiles`
  MODIFY COLUMN `buyer_type`
  VARCHAR(50) NOT NULL DEFAULT 'WHOLESALER';

ALTER TABLE `buyer_profiles`
  ADD COLUMN `business_address_id` BIGINT UNSIGNED DEFAULT NULL
  AFTER `primary_address_id`;

ALTER TABLE `buyer_profiles`
  ADD COLUMN `business_registration_number` VARCHAR(100) DEFAULT NULL
  AFTER `gst_number`;

ALTER TABLE `buyer_profiles`
  ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `buyer_profiles`
  ADD COLUMN `purchase_capacity` VARCHAR(100) DEFAULT NULL
  AFTER `business_registration_number`;

ALTER TABLE `buyer_profiles`
  ADD CONSTRAINT `fk_bp_biz_addr`
  FOREIGN KEY (`business_address_id`)
  REFERENCES `addresses` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;


-- ----------------------------------------------------------------------------
-- 8. FARMER PRIMARY CROPS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `farmer_primary_crops` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `farmer_profile_id` BIGINT UNSIGNED NOT NULL,
  `crop_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_farmer_crop` (`farmer_profile_id`, `crop_id`),
  CONSTRAINT `fk_fpc_farmer`
    FOREIGN KEY (`farmer_profile_id`)
    REFERENCES `farmer_profiles` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_fpc_crop`
    FOREIGN KEY (`crop_id`)
    REFERENCES `crops` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ----------------------------------------------------------------------------
-- 9. BUYER PROCUREMENT CROPS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `buyer_procurement_crops` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `buyer_profile_id` BIGINT UNSIGNED NOT NULL,
  `crop_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_buyer_crop` (`buyer_profile_id`, `crop_id`),
  CONSTRAINT `fk_bpc_buyer`
    FOREIGN KEY (`buyer_profile_id`)
    REFERENCES `buyer_profiles` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_bpc_crop`
    FOREIGN KEY (`crop_id`)
    REFERENCES `crops` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ----------------------------------------------------------------------------
-- RESTORE FOREIGN KEY CHECKS
-- ----------------------------------------------------------------------------

SET FOREIGN_KEY_CHECKS = 1;