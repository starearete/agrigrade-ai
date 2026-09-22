-- ============================================================================
-- AgriGrade AI – Flyway Migration V3
-- Cascade Delete for User Dependent Profiles and Farm Address Relationships
-- ============================================================================

ALTER TABLE `farmer_profiles` DROP FOREIGN KEY `fk_fp_user`;
ALTER TABLE `farmer_profiles`
  ADD CONSTRAINT `fk_fp_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE `buyer_profiles` DROP FOREIGN KEY `fk_bp_user`;
ALTER TABLE `buyer_profiles`
  ADD CONSTRAINT `fk_bp_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE `farms` DROP FOREIGN KEY `fk_farm_address`;
ALTER TABLE `farms`
  ADD CONSTRAINT `fk_farm_address`
    FOREIGN KEY (`address_id`)
    REFERENCES `addresses` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

