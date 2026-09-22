package com.agrigrade.crop.repository;

import com.agrigrade.crop.entity.CropCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CropCategoryRepository extends JpaRepository<CropCategory, Long> {
    Optional<CropCategory> findByCode(String code);
}
