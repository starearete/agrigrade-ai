-- ============================================================================
-- AgriGrade AI – Flyway Migration V7
-- Cascade Delete for Product Batches on Farmer Profile and Address deletion
-- ============================================================================

ALTER TABLE `product_batches` DROP FOREIGN KEY `fk_pb_farmer`;
ALTER TABLE `product_batches`
  ADD CONSTRAINT `fk_pb_farmer`
    FOREIGN KEY (`farmer_id`)
    REFERENCES `farmer_profiles` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE `product_batches` DROP FOREIGN KEY `fk_pb_location`;
ALTER TABLE `product_batches`
  ADD CONSTRAINT `fk_pb_location`
    FOREIGN KEY (`harvest_location_id`)
    REFERENCES `addresses` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
