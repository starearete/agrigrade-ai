-- Flyway Migration: V18__cleanup_duplicate_markets.sql
-- Description: Deduplicate market records with identical name and district
--              to prevent duplicate rendering

-- Temporary table to hold canonical (lowest id) mapping for duplicates
CREATE TEMPORARY TABLE `canonical_markets` (
    `canonical_id` BIGINT,
    `name` VARCHAR(255),
    `district` VARCHAR(255)
);

INSERT INTO `canonical_markets` (`canonical_id`, `name`, `district`)
SELECT
    MIN(`id`) AS `canonical_id`,
    `name`,
    district
FROM `markets`
GROUP BY `name`, district;

-- Update market_rates pointing to duplicate market ids
UPDATE `market_rates` mr
JOIN `markets` m
    ON mr.`market_id` = m.`id`
JOIN `canonical_markets` cm
    ON m.`name` = cm.`name`
    AND m.`district` = cm.`district`
SET mr.`market_id` = cm.`canonical_id`
WHERE mr.`market_id` != cm.`canonical_id`;

-- Delete non-canonical duplicate market rows
DELETE m
FROM `markets` m
LEFT JOIN `canonical_markets` cm
    ON m.`id` = cm.`canonical_id`
WHERE cm.`canonical_id` IS NULL;

-- Drop temporary table
DROP TEMPORARY TABLE IF EXISTS `canonical_markets`;