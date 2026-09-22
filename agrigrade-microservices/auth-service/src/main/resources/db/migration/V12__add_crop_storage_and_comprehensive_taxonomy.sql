-- ============================================================================
-- AgriGrade AI – Schema Migration (V12)
-- Crop Default Storage Conditions & Comprehensive Cultivar Taxonomy
-- ============================================================================

-- 1. Add default_storage_condition to crops table
ALTER TABLE `crops` ADD COLUMN `default_storage_condition` VARCHAR(100) DEFAULT 'Cool storage';

-- 2. Upsert / Configure All 14 Standard Agricultural Crops
-- Banana
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'BANANA', 'Banana', 'Musa acuminata', 12, 'Cool, ventilated storage', 1 FROM `crop_categories` cc WHERE cc.code = 'FRUITS'
ON DUPLICATE KEY UPDATE 
    `name` = 'Banana',
    `scientific_name` = 'Musa acuminata',
    `base_shelf_life_days` = 12,
    `default_storage_condition` = 'Cool, ventilated storage',
    `is_active` = 1;

-- Mango
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'MANGO', 'Mango', 'Mangifera indica', 14, 'Cool storage', 1 FROM `crop_categories` cc WHERE cc.code = 'FRUITS'
ON DUPLICATE KEY UPDATE 
    `name` = 'Mango',
    `scientific_name` = 'Mangifera indica',
    `base_shelf_life_days` = 14,
    `default_storage_condition` = 'Cool storage',
    `is_active` = 1;

-- Tomato
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'TOMATO', 'Tomato', 'Solanum lycopersicum', 10, 'Ambient / cool storage', 1 FROM `crop_categories` cc WHERE cc.code = 'VEGETABLES'
ON DUPLICATE KEY UPDATE 
    `name` = 'Tomato',
    `scientific_name` = 'Solanum lycopersicum',
    `base_shelf_life_days` = 10,
    `default_storage_condition` = 'Ambient / cool storage',
    `is_active` = 1;

-- Onion
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'ONION', 'Onion', 'Allium cepa', 30, 'Dry, well-ventilated storage', 1 FROM `crop_categories` cc WHERE cc.code = 'TUBERS'
ON DUPLICATE KEY UPDATE 
    `name` = 'Onion',
    `scientific_name` = 'Allium cepa',
    `base_shelf_life_days` = 30,
    `default_storage_condition` = 'Dry, well-ventilated storage',
    `is_active` = 1;

-- Brinjal / Eggplant
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'BRINJAL', 'Brinjal / Eggplant', 'Solanum melongena', 7, 'Cool, humid storage', 1 FROM `crop_categories` cc WHERE cc.code = 'VEGETABLES'
ON DUPLICATE KEY UPDATE 
    `name` = 'Brinjal / Eggplant',
    `scientific_name` = 'Solanum melongena',
    `base_shelf_life_days` = 7,
    `default_storage_condition` = 'Cool, humid storage',
    `is_active` = 1;

-- Bhendi / Okra
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'BHENDI', 'Bhendi / Okra', 'Abelmoschus esculentus', 5, 'Cool, humid storage', 1 FROM `crop_categories` cc WHERE cc.code = 'VEGETABLES'
ON DUPLICATE KEY UPDATE 
    `name` = 'Bhendi / Okra',
    `scientific_name` = 'Abelmoschus esculentus',
    `base_shelf_life_days` = 5,
    `default_storage_condition` = 'Cool, humid storage',
    `is_active` = 1;

-- Green Chilli
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'CHILLI', 'Green Chilli', 'Capsicum annuum', 10, 'Cool storage', 1 FROM `crop_categories` cc WHERE cc.code = 'VEGETABLES'
ON DUPLICATE KEY UPDATE 
    `name` = 'Green Chilli',
    `scientific_name` = 'Capsicum annuum',
    `base_shelf_life_days` = 10,
    `default_storage_condition` = 'Cool storage',
    `is_active` = 1;

-- Drumstick / Moringa
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'DRUMSTICK', 'Drumstick / Moringa', 'Moringa oleifera', 7, 'Cool, humid storage', 1 FROM `crop_categories` cc WHERE cc.code = 'VEGETABLES'
ON DUPLICATE KEY UPDATE 
    `name` = 'Drumstick / Moringa',
    `scientific_name` = 'Moringa oleifera',
    `base_shelf_life_days` = 7,
    `default_storage_condition` = 'Cool, humid storage',
    `is_active` = 1;

-- Bottle Gourd
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'BOTTLE_GOURD', 'Bottle Gourd', 'Lagenaria siceraria', 14, 'Cool, dry storage', 1 FROM `crop_categories` cc WHERE cc.code = 'VEGETABLES'
ON DUPLICATE KEY UPDATE 
    `name` = 'Bottle Gourd',
    `scientific_name` = 'Lagenaria siceraria',
    `base_shelf_life_days` = 14,
    `default_storage_condition` = 'Cool, dry storage',
    `is_active` = 1;

-- Bitter Gourd
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'BITTER_GOURD', 'Bitter Gourd', 'Momordica charantia', 8, 'Cool storage', 1 FROM `crop_categories` cc WHERE cc.code = 'VEGETABLES'
ON DUPLICATE KEY UPDATE 
    `name` = 'Bitter Gourd',
    `scientific_name` = 'Momordica charantia',
    `base_shelf_life_days` = 8,
    `default_storage_condition` = 'Cool storage',
    `is_active` = 1;

-- Snake Gourd
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'SNAKE_GOURD', 'Snake Gourd', 'Trichosanthes cucumerina', 7, 'Cool storage', 1 FROM `crop_categories` cc WHERE cc.code = 'VEGETABLES'
ON DUPLICATE KEY UPDATE 
    `name` = 'Snake Gourd',
    `scientific_name` = 'Trichosanthes cucumerina',
    `base_shelf_life_days` = 7,
    `default_storage_condition` = 'Cool storage',
    `is_active` = 1;

-- Carrot
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'CARROT', 'Carrot', 'Daucus carota', 21, 'Refrigerated storage', 1 FROM `crop_categories` cc WHERE cc.code = 'TUBERS'
ON DUPLICATE KEY UPDATE 
    `name` = 'Carrot',
    `scientific_name` = 'Daucus carota',
    `base_shelf_life_days` = 21,
    `default_storage_condition` = 'Refrigerated storage',
    `is_active` = 1;

-- Beetroot
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'BEETROOT', 'Beetroot', 'Beta vulgaris', 20, 'Refrigerated / cool storage', 1 FROM `crop_categories` cc WHERE cc.code = 'TUBERS'
ON DUPLICATE KEY UPDATE 
    `name` = 'Beetroot',
    `scientific_name` = 'Beta vulgaris',
    `base_shelf_life_days` = 20,
    `default_storage_condition` = 'Refrigerated / cool storage',
    `is_active` = 1;

-- Tapioca
INSERT INTO `crops` (`category_id`, `code`, `name`, `scientific_name`, `base_shelf_life_days`, `default_storage_condition`, `is_active`)
SELECT cc.id, 'TAPIOCA', 'Tapioca', 'Manihot esculenta', 15, 'Cool, dry storage', 1 FROM `crop_categories` cc WHERE cc.code = 'TUBERS'
ON DUPLICATE KEY UPDATE 
    `name` = 'Tapioca',
    `scientific_name` = 'Manihot esculenta',
    `base_shelf_life_days` = 15,
    `default_storage_condition` = 'Cool, dry storage',
    `is_active` = 1;

-- Deactivate legacy umbrella groupings
UPDATE `crops` SET `is_active` = 0 WHERE `code` IN ('GOURDS', 'TUBERS');

-- 3. Comprehensive Cultivars / Varieties Seeding

-- Banana Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_ROBUSTA', 'Robusta', 'Musa AAA Robusta', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_RASTHALI', 'Rasthali', 'Musa AAB Rasthali', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_POOVAN', 'Poovan', 'Musa AAB Poovan', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_NENDRAN', 'Nendran', 'Musa AAB Nendran', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_YELAKKI', 'Yelakki', 'Musa AB Ney Poovan / Yelakki', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_G9', 'Grand Naine', 'Musa acuminata Grand Naine', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_MONTHAN', 'Monthan', 'Musa ABB Monthan', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_KARPURAVALLI', 'Karpuravalli', 'Musa ABB Karpooravalli', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_NEY_POOVAN', 'Ney Poovan', 'Musa AB Ney Poovan', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BANANA_RED', 'Red Banana', 'Musa AAA Red Banana', 1 FROM `crops` c WHERE c.code = 'BANANA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Mango Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'MANGO_ALPHONSO', 'Alphonso', 'Mangifera indica Alphonso', 1 FROM `crops` c WHERE c.code = 'MANGO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'MANGO_BANGANAPALLI', 'Banganapalli', 'Mangifera indica Banganapalli', 1 FROM `crops` c WHERE c.code = 'MANGO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'MANGO_TOTAPURI', 'Totapuri', 'Mangifera indica Totapuri', 1 FROM `crops` c WHERE c.code = 'MANGO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'MANGO_KESAR', 'Kesar', 'Mangifera indica Kesar', 1 FROM `crops` c WHERE c.code = 'MANGO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'MANGO_DASHEHARI', 'Dashehari', 'Mangifera indica Dashehari', 1 FROM `crops` c WHERE c.code = 'MANGO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'MANGO_NEELAM', 'Neelam', 'Mangifera indica Neelam', 1 FROM `crops` c WHERE c.code = 'MANGO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'MANGO_MALLIKA', 'Mallika', 'Mangifera indica Mallika', 1 FROM `crops` c WHERE c.code = 'MANGO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'MANGO_CHAUSA', 'Chausa', 'Mangifera indica Chausa', 1 FROM `crops` c WHERE c.code = 'MANGO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'MANGO_IMAM_PASAND', 'Imam Pasand', 'Mangifera indica Imam Pasand', 1 FROM `crops` c WHERE c.code = 'MANGO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'MANGO_MALGOA', 'Malgoa', 'Mangifera indica Malgoa', 1 FROM `crops` c WHERE c.code = 'MANGO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Tomato Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TOMATO_ARKA_RAKSHAK', 'Arka Rakshak', 'Solanum lycopersicum Arka Rakshak', 1 FROM `crops` c WHERE c.code = 'TOMATO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TOMATO_ARKA_VIKAS', 'Arka Vikas', 'Solanum lycopersicum Arka Vikas', 1 FROM `crops` c WHERE c.code = 'TOMATO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TOMATO_ARKA_SAURABH', 'Arka Saurabh', 'Solanum lycopersicum Arka Saurabh', 1 FROM `crops` c WHERE c.code = 'TOMATO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TOMATO_PUSA_RUBY', 'Pusa Ruby', 'Solanum lycopersicum Pusa Ruby', 1 FROM `crops` c WHERE c.code = 'TOMATO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TOMATO_PUSA_HYBRID_4', 'Pusa Hybrid-4', 'Solanum lycopersicum Pusa Hybrid-4', 1 FROM `crops` c WHERE c.code = 'TOMATO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TOMATO_NAMDHARI', 'Namdhari', 'Solanum lycopersicum Namdhari', 1 FROM `crops` c WHERE c.code = 'TOMATO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TOMATO_VAISHNAVI', 'Vaishnavi', 'Solanum lycopersicum Vaishnavi', 1 FROM `crops` c WHERE c.code = 'TOMATO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TOMATO_ABHINAV', 'Abhinav', 'Solanum lycopersicum Abhinav', 1 FROM `crops` c WHERE c.code = 'TOMATO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TOMATO_CO3', 'CO-3 (Hybrid Country)', 'Solanum lycopersicum CO3', 1 FROM `crops` c WHERE c.code = 'TOMATO'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Onion Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'ONION_N53', 'N-53', 'Allium cepa N-53', 1 FROM `crops` c WHERE c.code = 'ONION'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'ONION_AGRIFOUND_LIGHT_RED', 'Agrifound Light Red', 'Allium cepa Agrifound Light Red', 1 FROM `crops` c WHERE c.code = 'ONION'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'ONION_AGRIFOUND_DARK_RED', 'Agrifound Dark Red', 'Allium cepa Agrifound Dark Red', 1 FROM `crops` c WHERE c.code = 'ONION'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'ONION_BHIMA_SUPER', 'Bhima Super', 'Allium cepa Bhima Super', 1 FROM `crops` c WHERE c.code = 'ONION'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'ONION_BHIMA_KIRAN', 'Bhima Kiran', 'Allium cepa Bhima Kiran', 1 FROM `crops` c WHERE c.code = 'ONION'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'ONION_BHIMA_SHAKTI', 'Bhima Shakti', 'Allium cepa Bhima Shakti', 1 FROM `crops` c WHERE c.code = 'ONION'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'ONION_PUSA_RED', 'Pusa Red', 'Allium cepa Pusa Red', 1 FROM `crops` c WHERE c.code = 'ONION'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'ONION_SHALLOT', 'Small Onion / Shallot', 'Allium cepa aggregatum', 1 FROM `crops` c WHERE c.code = 'ONION'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Brinjal / Eggplant Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BRINJAL_PUSA_PURPLE_LONG', 'Pusa Purple Long', 'Solanum melongena Pusa Purple Long', 1 FROM `crops` c WHERE c.code = 'BRINJAL'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BRINJAL_PUSA_PURPLE_ROUND', 'Pusa Purple Round', 'Solanum melongena Pusa Purple Round', 1 FROM `crops` c WHERE c.code = 'BRINJAL'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BRINJAL_ARKA_NIDHI', 'Arka Nidhi', 'Solanum melongena Arka Nidhi', 1 FROM `crops` c WHERE c.code = 'BRINJAL'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BRINJAL_ARKA_KESHAV', 'Arka Keshav', 'Solanum melongena Arka Keshav', 1 FROM `crops` c WHERE c.code = 'BRINJAL'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BRINJAL_ARKA_NEELKANTH', 'Arka Neelkanth', 'Solanum melongena Arka Neelkanth', 1 FROM `crops` c WHERE c.code = 'BRINJAL'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BRINJAL_UJALA', 'Ujala', 'Solanum melongena Ujala', 1 FROM `crops` c WHERE c.code = 'BRINJAL'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BRINJAL_BLACK_BEAUTY', 'Black Beauty', 'Solanum melongena Black Beauty', 1 FROM `crops` c WHERE c.code = 'BRINJAL'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Bhendi / Okra Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BHENDI_ARKA_ANAMIKA', 'Arka Anamika', 'Abelmoschus esculentus Arka Anamika', 1 FROM `crops` c WHERE c.code = 'BHENDI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BHENDI_ARKA_ABHAY', 'Arka Abhay', 'Abelmoschus esculentus Arka Abhay', 1 FROM `crops` c WHERE c.code = 'BHENDI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BHENDI_PUSA_SAWANI', 'Pusa Sawani', 'Abelmoschus esculentus Pusa Sawani', 1 FROM `crops` c WHERE c.code = 'BHENDI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BHENDI_PUSA_A4', 'Pusa A-4', 'Abelmoschus esculentus Pusa A-4', 1 FROM `crops` c WHERE c.code = 'BHENDI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BHENDI_PARBHANI_KRANTI', 'Parbhani Kranti', 'Abelmoschus esculentus Parbhani Kranti', 1 FROM `crops` c WHERE c.code = 'BHENDI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BHENDI_VIJAY', 'Vijay', 'Abelmoschus esculentus Vijay', 1 FROM `crops` c WHERE c.code = 'BHENDI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BHENDI_VARSHA', 'Varsha', 'Abelmoschus esculentus Varsha', 1 FROM `crops` c WHERE c.code = 'BHENDI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Green Chilli Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CHILLI_PUSA_JWALA', 'Pusa Jwala', 'Capsicum annuum Pusa Jwala', 1 FROM `crops` c WHERE c.code = 'CHILLI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CHILLI_PANT_C1', 'Pant C-1', 'Capsicum annuum Pant C-1', 1 FROM `crops` c WHERE c.code = 'CHILLI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CHILLI_ARKA_LOHIT', 'Arka Lohit', 'Capsicum annuum Arka Lohit', 1 FROM `crops` c WHERE c.code = 'CHILLI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CHILLI_BYADAGI', 'Byadagi', 'Capsicum annuum Byadagi', 1 FROM `crops` c WHERE c.code = 'CHILLI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CHILLI_G4', 'G-4', 'Capsicum annuum G-4', 1 FROM `crops` c WHERE c.code = 'CHILLI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CHILLI_LCA235', 'LCA-235', 'Capsicum annuum LCA-235', 1 FROM `crops` c WHERE c.code = 'CHILLI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CHILLI_KASHI_ANMOL', 'Kashi Anmol', 'Capsicum annuum Kashi Anmol', 1 FROM `crops` c WHERE c.code = 'CHILLI'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Drumstick / Moringa Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'DRUMSTICK_PKM1', 'PKM-1', 'Moringa oleifera PKM-1', 1 FROM `crops` c WHERE c.code = 'DRUMSTICK'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'DRUMSTICK_PKM2', 'PKM-2', 'Moringa oleifera PKM-2', 1 FROM `crops` c WHERE c.code = 'DRUMSTICK'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'DRUMSTICK_ODC3', 'ODC-3', 'Moringa oleifera ODC-3', 1 FROM `crops` c WHERE c.code = 'DRUMSTICK'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'DRUMSTICK_BHAGYA', 'Bhagya', 'Moringa oleifera Bhagya', 1 FROM `crops` c WHERE c.code = 'DRUMSTICK'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'DRUMSTICK_DHANRAJ', 'Dhanraj', 'Moringa oleifera Dhanraj', 1 FROM `crops` c WHERE c.code = 'DRUMSTICK'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'DRUMSTICK_CO1', 'Coimbatore-1', 'Moringa oleifera Coimbatore-1', 1 FROM `crops` c WHERE c.code = 'DRUMSTICK'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'DRUMSTICK_CO2', 'Coimbatore-2', 'Moringa oleifera Coimbatore-2', 1 FROM `crops` c WHERE c.code = 'DRUMSTICK'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Bottle Gourd Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BOTTLE_GOURD_ARKA_BAHAR', 'Arka Bahar', 'Lagenaria siceraria Arka Bahar', 1 FROM `crops` c WHERE c.code = 'BOTTLE_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BOTTLE_GOURD_PUSA_NAVEEN', 'Pusa Naveen', 'Lagenaria siceraria Pusa Naveen', 1 FROM `crops` c WHERE c.code = 'BOTTLE_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BOTTLE_GOURD_PUSA_SUMMER', 'Pusa Summer Prolific Long', 'Lagenaria siceraria Pusa Summer Prolific Long', 1 FROM `crops` c WHERE c.code = 'BOTTLE_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BOTTLE_GOURD_PUNJAB_LONG', 'Punjab Long', 'Lagenaria siceraria Punjab Long', 1 FROM `crops` c WHERE c.code = 'BOTTLE_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BOTTLE_GOURD_KASHI_GANGA', 'Kashi Ganga', 'Lagenaria siceraria Kashi Ganga', 1 FROM `crops` c WHERE c.code = 'BOTTLE_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Bitter Gourd Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BITTER_GOURD_PRIYA', 'Priya', 'Momordica charantia Priya', 1 FROM `crops` c WHERE c.code = 'BITTER_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BITTER_GOURD_PREETHI', 'Preethi', 'Momordica charantia Preethi', 1 FROM `crops` c WHERE c.code = 'BITTER_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BITTER_GOURD_ARKA_HARIT', 'Arka Harit', 'Momordica charantia Arka Harit', 1 FROM `crops` c WHERE c.code = 'BITTER_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BITTER_GOURD_PUSA_DO_MAUSAMI', 'Pusa Do Mausami', 'Momordica charantia Pusa Do Mausami', 1 FROM `crops` c WHERE c.code = 'BITTER_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BITTER_GOURD_COIMBATORE_LONG', 'Coimbatore Long', 'Momordica charantia Coimbatore Long', 1 FROM `crops` c WHERE c.code = 'BITTER_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BITTER_GOURD_MDU1', 'MDU-1', 'Momordica charantia MDU-1', 1 FROM `crops` c WHERE c.code = 'BITTER_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Snake Gourd Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'SNAKE_GOURD_COIMBATORE_LONG', 'Coimbatore Long', 'Trichosanthes cucumerina Coimbatore Long', 1 FROM `crops` c WHERE c.code = 'SNAKE_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'SNAKE_GOURD_CO1', 'CO-1', 'Trichosanthes cucumerina CO-1', 1 FROM `crops` c WHERE c.code = 'SNAKE_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'SNAKE_GOURD_CO2', 'CO-2', 'Trichosanthes cucumerina CO-2', 1 FROM `crops` c WHERE c.code = 'SNAKE_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'SNAKE_GOURD_PKM1', 'PKM-1', 'Trichosanthes cucumerina PKM-1', 1 FROM `crops` c WHERE c.code = 'SNAKE_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'SNAKE_GOURD_ARKA_PRABHATH', 'Arka Prabhath', 'Trichosanthes cucumerina Arka Prabhath', 1 FROM `crops` c WHERE c.code = 'SNAKE_GOURD'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Carrot Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CARROT_PUSA_KESAR', 'Pusa Kesar', 'Daucus carota Pusa Kesar', 1 FROM `crops` c WHERE c.code = 'CARROT'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CARROT_PUSA_RUDHIRA', 'Pusa Rudhira', 'Daucus carota Pusa Rudhira', 1 FROM `crops` c WHERE c.code = 'CARROT'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CARROT_NEW_KURODA', 'New Kuroda', 'Daucus carota New Kuroda', 1 FROM `crops` c WHERE c.code = 'CARROT'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CARROT_NANTES', 'Nantes', 'Daucus carota Nantes', 1 FROM `crops` c WHERE c.code = 'CARROT'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'CARROT_CHANTENAY', 'Chantenay', 'Daucus carota Chantenay', 1 FROM `crops` c WHERE c.code = 'CARROT'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Beetroot Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BEETROOT_DETROIT_DARK_RED', 'Detroit Dark Red', 'Beta vulgaris Detroit Dark Red', 1 FROM `crops` c WHERE c.code = 'BEETROOT'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BEETROOT_CRIMSON_GLOBE', 'Crimson Globe', 'Beta vulgaris Crimson Globe', 1 FROM `crops` c WHERE c.code = 'BEETROOT'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BEETROOT_EARLY_WONDER', 'Early Wonder', 'Beta vulgaris Early Wonder', 1 FROM `crops` c WHERE c.code = 'BEETROOT'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BEETROOT_RUBY_QUEEN', 'Ruby Queen', 'Beta vulgaris Ruby Queen', 1 FROM `crops` c WHERE c.code = 'BEETROOT'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'BEETROOT_CYLINDRA', 'Cylindra', 'Beta vulgaris Cylindra', 1 FROM `crops` c WHERE c.code = 'BEETROOT'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Tapioca Varieties
INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TAPIOCA_H165', 'H-165', 'Manihot esculenta H-165', 1 FROM `crops` c WHERE c.code = 'TAPIOCA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TAPIOCA_H226', 'H-226', 'Manihot esculenta H-226', 1 FROM `crops` c WHERE c.code = 'TAPIOCA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TAPIOCA_SREE_JAYA', 'Sree Jaya', 'Manihot esculenta Sree Jaya', 1 FROM `crops` c WHERE c.code = 'TAPIOCA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TAPIOCA_SREE_VIJAYA', 'Sree Vijaya', 'Manihot esculenta Sree Vijaya', 1 FROM `crops` c WHERE c.code = 'TAPIOCA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TAPIOCA_SREE_ATHULYA', 'Sree Athulya', 'Manihot esculenta Sree Athulya', 1 FROM `crops` c WHERE c.code = 'TAPIOCA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `crop_varieties` (`crop_id`, `code`, `name`, `scientific_name`, `is_active`)
SELECT c.id, 'TAPIOCA_M4', 'M4', 'Manihot esculenta M4', 1 FROM `crops` c WHERE c.code = 'TAPIOCA'
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
