-- ============================================================================
-- Flyway Migration V16: Tamil Nadu Taluks Master & Location-Enhanced Markets
-- Database: agrigrade_ai
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. TALUKS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `taluks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `district_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(30) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_taluks_name` (`district_id`, `name`),
  CONSTRAINT `fk_taluks_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 2. SEED TALUKS FOR KEY TAMIL NADU DISTRICTS
-- ----------------------------------------------------------------------------
-- Erode Taluks (District Code: TN-ER)
INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Sathyamangalam', 'TAL-SATHY' FROM `districts` d WHERE d.code = 'TN-ER'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Bhavani', 'TAL-BHAVANI' FROM `districts` d WHERE d.code = 'TN-ER'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Gobichettipalayam', 'TAL-[#GOBI]' FROM `districts` d WHERE d.code = 'TN-ER'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Erode', 'TAL-ERODE' FROM `districts` d WHERE d.code = 'TN-ER'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Perundurai', 'TAL-PERUNDURAI' FROM `districts` d WHERE d.code = 'TN-ER'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Modakurichi', 'TAL-MODAKURICHI' FROM `districts` d WHERE d.code = 'TN-ER'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Kodumudi', 'TAL-KODUMUDI' FROM `districts` d WHERE d.code = 'TN-ER'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Anthiyur', 'TAL-ANTHIYUR' FROM `districts` d WHERE d.code = 'TN-ER'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

-- Theni Taluks (District Code: TN-TH)
INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Uthamapalayam', 'TAL-UTHAMA' FROM `districts` d WHERE d.code = 'TN-TH'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Theni', 'TAL-THENI' FROM `districts` d WHERE d.code = 'TN-TH'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Bodinayakanur', 'TAL-BODI' FROM `districts` d WHERE d.code = 'TN-TH'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Periyakulam', 'TAL-PERIYAKULAM' FROM `districts` d WHERE d.code = 'TN-TH'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Andipatti', 'TAL-ANDIPATTI' FROM `districts` d WHERE d.code = 'TN-TH'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

-- Dindigul Taluks (District Code: TN-DI)
INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Oddanchatram', 'TAL-ODDANCHATRAM' FROM `districts` d WHERE d.code = 'TN-DI'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Dindigul', 'TAL-DINDIGUL' FROM `districts` d WHERE d.code = 'TN-DI'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Palani', 'TAL-PALANI' FROM `districts` d WHERE d.code = 'TN-DI'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Kodaikanal', 'TAL-KODAI' FROM `districts` d WHERE d.code = 'TN-DI'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Nattam', 'TAL-NATTAM' FROM `districts` d WHERE d.code = 'TN-DI'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

-- Coimbatore Taluks (District Code: TN-CO)
INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Coimbatore North', 'TAL-CBE-NORTH' FROM `districts` d WHERE d.code = 'TN-CO'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Coimbatore South', 'TAL-CBE-SOUTH' FROM `districts` d WHERE d.code = 'TN-CO'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Pollachi', 'TAL-POLLACHI' FROM `districts` d WHERE d.code = 'TN-CO'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `taluks` (`district_id`, `name`, `code`)
SELECT d.id, 'Mettupalayam', 'TAL-METTUPALAYAM' FROM `districts` d WHERE d.code = 'TN-CO'
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

-- ----------------------------------------------------------------------------
-- 3. ENHANCE MARKETS TABLE WITH TALUK & DISTRICT_ID
-- ----------------------------------------------------------------------------
ALTER TABLE `markets`
  ADD COLUMN `taluk` VARCHAR(150) DEFAULT NULL AFTER `district`,
  ADD COLUMN `district_id` BIGINT UNSIGNED DEFAULT NULL AFTER `taluk`,
  ADD COLUMN `village_town_city` VARCHAR(150) DEFAULT NULL AFTER `district_id`;

-- Update existing market district_ids
UPDATE `markets` m
JOIN `districts` d ON d.name = m.district AND d.state_id = 1
SET m.district_id = d.id;

-- Seed Erode & Additional Regional Markets
INSERT INTO `markets` (`code`, `name`, `market_type`, `district`, `taluk`, `district_id`, `state`, `address_line`, `latitude`, `longitude`, `is_active`)
SELECT 'MKT-ERODE-SAMPATH', 'Erode Sampath Nagar Wholesale Mandi', 'MANDI', 'Erode', 'Erode', d.id, 'Tamil Nadu', 'Sampath Nagar, Erode', 11.34100000, 77.71720000, 1
FROM `districts` d WHERE d.code = 'TN-ER'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `markets` (`code`, `name`, `market_type`, `district`, `taluk`, `district_id`, `state`, `address_line`, `latitude`, `longitude`, `is_active`)
SELECT 'MKT-SATHY-FPO', 'Sathyamangalam Farmer Producer Mandi', 'DIRECT_BUYER_HUB', 'Erode', 'Sathyamangalam', d.id, 'Tamil Nadu', 'Bhavani Main Road, Sathyamangalam', 11.50340000, 77.24440000, 1
FROM `districts` d WHERE d.code = 'TN-ER'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `markets` (`code`, `name`, `market_type`, `district`, `taluk`, `district_id`, `state`, `address_line`, `latitude`, `longitude`, `is_active`)
SELECT 'MKT-GOBI-AGRI', 'Gobichettipalayam Agricultural Regulated Market', 'MANDI', 'Erode', 'Gobichettipalayam', d.id, 'Tamil Nadu', 'Kutchery Street, Gobi', 11.45460000, 77.43730000, 1
FROM `districts` d WHERE d.code = 'TN-ER'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed Market Rates for Erode Markets
INSERT INTO `market_rates` (`market_id`, `variety_id`, `min_price_per_kg`, `max_price_per_kg`, `modal_price_per_kg`, `quantity_arrived_tons`, `observed_at`)
SELECT m.id, cv.id, 25.00, 31.00, 28.00, 22.50, NOW()
FROM `markets` m, `crop_varieties` cv
WHERE m.code = 'MKT-ERODE-SAMPATH' AND cv.code = 'BANANA_G9'
LIMIT 1;

INSERT INTO `market_rates` (`market_id`, `variety_id`, `min_price_per_kg`, `max_price_per_kg`, `modal_price_per_kg`, `quantity_arrived_tons`, `observed_at`)
SELECT m.id, cv.id, 26.00, 32.50, 29.00, 18.00, NOW()
FROM `markets` m, `crop_varieties` cv
WHERE m.code = 'MKT-SATHY-FPO' AND cv.code = 'BANANA_G9'
LIMIT 1;

INSERT INTO `market_rates` (`market_id`, `variety_id`, `min_price_per_kg`, `max_price_per_kg`, `modal_price_per_kg`, `quantity_arrived_tons`, `observed_at`)
SELECT m.id, cv.id, 22.00, 28.00, 25.00, 35.00, NOW()
FROM `markets` m, `crop_varieties` cv
WHERE m.code = 'MKT-SATHY-FPO' AND cv.code = 'TOMATO_CO3'
LIMIT 1;

SET FOREIGN_KEY_CHECKS = 1;
