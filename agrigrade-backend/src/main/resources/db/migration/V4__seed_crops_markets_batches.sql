-- ============================================================================
-- AgriGrade AI – Seed Data Migration (V4)
-- Standard Crops Taxonomy, Regional Mandis & Initial Market Rates
-- ============================================================================

-- 1. Crop Categories
INSERT INTO `crop_categories` (`code`, `name`, `description`) VALUES
('FRUITS', 'Fruits', 'Fresh agricultural fruit produce'),
('VEGETABLES', 'Vegetables', 'Fresh agricultural vegetable produce')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. Crops
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT cc.id, 'BANANA', 'Banana', 'Musa acuminata', 1 FROM `crop_categories` cc WHERE cc.code = 'FRUITS'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT cc.id, 'MANGO', 'Mango', 'Mangifera indica', 1 FROM `crop_categories` cc WHERE cc.code = 'FRUITS'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT cc.id, 'TOMATO', 'Tomato', 'Solanum lycopersicum', 1 FROM `crop_categories` cc WHERE cc.code = 'VEGETABLES'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT cc.id, 'ONION', 'Onion', 'Allium cepa', 1 FROM `crop_categories` cc WHERE cc.code = 'VEGETABLES'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT cc.id, 'BEETROOT', 'Beetroot', 'Beta vulgaris', 1 FROM `crop_categories` cc WHERE cc.code = 'VEGETABLES'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. Crop Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_G9', 'G9 / Grand Naine', 'Musa acuminata Grand Naine', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_NENDRAN', 'Nendran', 'Musa AAB Nendran', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TOMATO_CO3', 'CO-3 (Hybrid Country)', 'Solanum lycopersicum CO3', 1 FROM `crops` c WHERE c.code = 'TOMATO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'ONION_SHALLOT', 'Small Onion / Shallot', 'Allium cepa aggregatum', 1 FROM `crops` c WHERE c.code = 'ONION'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 4. Markets (Tamil Nadu Mandis & Wholesale Hubs)
INSERT INTO `markets` (`code`, `name`, `market_type`, `district`, `state`, `address_line`, `latitude`, `longitude`, `is_active`) VALUES
('MKT-THENI', 'Theni Farmers Wholesale Mandi', 'MANDI', 'Theni', 'Tamil Nadu', 'Main Road, Theni', 10.01040000, 77.47680000, 1),
('MKT-DINDIGUL', 'Dindigul Central Market', 'MANDI', 'Dindigul', 'Tamil Nadu', 'Grand Bazaar, Dindigul', 10.36730000, 77.98030000, 1),
('MKT-MADURAI', 'Madurai Mattuthavani Wholesale Market', 'WHOLESALE_HUB', 'Madurai', 'Tamil Nadu', 'Mattuthavani, Madurai', 9.92520000, 78.11980000, 1),
('MKT-COIMBATORE', 'Coimbatore MGR Wholesale Market', 'WHOLESALE_HUB', 'Coimbatore', 'Tamil Nadu', 'Mettupalayam Road, Coimbatore', 11.01680000, 76.95580000, 1),
('MKT-TRICHY', 'Tiruchirappalli Gandhi Market', 'MANDI', 'Tiruchirappalli', 'Tamil Nadu', 'Gandhi Market, Trichy', 10.79050000, 78.70470000, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 5. Market Rates (Using subqueries for FK resolution)
INSERT INTO `market_rates` (`market_id`, `variety_id`, `min_price_per_kg`, `max_price_per_kg`, `modal_price_per_kg`, `quantity_arrived_tons`, `observed_at`)
SELECT m.id, cv.id, 24.00, 32.00, 28.50, 15.50, NOW()
FROM `markets` m, `crop_varieties` cv
WHERE m.code = 'MKT-THENI' AND cv.code = 'BANANA_G9'
LIMIT 1;

INSERT INTO `market_rates` (`market_id`, `variety_id`, `min_price_per_kg`, `max_price_per_kg`, `modal_price_per_kg`, `quantity_arrived_tons`, `observed_at`)
SELECT m.id, cv.id, 23.00, 30.00, 26.50, 12.00, NOW()
FROM `markets` m, `crop_varieties` cv
WHERE m.code = 'MKT-DINDIGUL' AND cv.code = 'BANANA_G9'
LIMIT 1;

INSERT INTO `market_rates` (`market_id`, `variety_id`, `min_price_per_kg`, `max_price_per_kg`, `modal_price_per_kg`, `quantity_arrived_tons`, `observed_at`)
SELECT m.id, cv.id, 38.00, 48.00, 44.00, 8.00, NOW()
FROM `markets` m, `crop_varieties` cv
WHERE m.code = 'MKT-THENI' AND cv.code = 'BANANA_NENDRAN'
LIMIT 1;
