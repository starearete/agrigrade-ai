package com.agrigrade.crop.repository;

import com.agrigrade.crop.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CropRepository extends JpaRepository<Crop, Long> {
    List<Crop> findByIsActiveTrue();
    Optional<Crop> findByCode(String code);
    Optional<Crop> findByNameIgnoreCase(String name);
}
