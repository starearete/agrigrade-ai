-- V11: Expand assigned_grade column in quality_results to VARCHAR(50) to support standard and flexible grade identifiers
ALTER TABLE `quality_results` MODIFY COLUMN `assigned_grade` VARCHAR(50) NOT NULL;
