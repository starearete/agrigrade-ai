-- V10: Add base_shelf_life_days to crops table and seed default values
ALTER TABLE crops ADD COLUMN base_shelf_life_days INT NOT NULL DEFAULT 14;

UPDATE crops SET base_shelf_life_days = 10 WHERE UPPER(code) = 'TOMATO';
UPDATE crops SET base_shelf_life_days = 12 WHERE UPPER(code) = 'BANANA';
UPDATE crops SET base_shelf_life_days = 14 WHERE UPPER(code) = 'MANGO';
UPDATE crops SET base_shelf_life_days = 30 WHERE UPPER(code) = 'ONION';
UPDATE crops SET base_shelf_life_days = 14 WHERE UPPER(code) = 'BEETROOT';
