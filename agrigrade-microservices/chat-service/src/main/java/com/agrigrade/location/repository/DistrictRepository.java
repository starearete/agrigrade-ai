package com.agrigrade.location.repository;

import com.agrigrade.location.entity.District;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DistrictRepository extends JpaRepository<District, Long> {
    List<District> findByStateIdOrderByNameAsc(Long stateId);
    Optional<District> findByStateIdAndNameIgnoreCase(Long stateId, String name);
    Optional<District> findByNameIgnoreCase(String name);
}
