package com.agrigrade.location.repository;

import com.agrigrade.location.entity.Taluk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TalukRepository extends JpaRepository<Taluk, Long> {
    List<Taluk> findByDistrictIdOrderByNameAsc(Long districtId);
    Optional<Taluk> findByDistrictIdAndNameIgnoreCase(Long districtId, String name);
}
