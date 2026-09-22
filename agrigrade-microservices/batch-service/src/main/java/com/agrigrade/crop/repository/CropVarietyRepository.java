package com.agrigrade.crop.repository;

import com.agrigrade.crop.entity.CropVariety;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CropVarietyRepository extends JpaRepository<CropVariety, Long> {
    List<CropVariety> findByCropIdAndIsActiveTrue(Long cropId);
    Optional<CropVariety> findByCropIdAndNameIgnoreCase(Long cropId, String name);
    Optional<CropVariety> findByNameIgnoreCase(String name);
}
