-- V9: Allow DELETED status on marketplace_listings table
ALTER TABLE marketplace_listings MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';
