package com.agrigrade.profile.repository;

import com.agrigrade.profile.entity.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmRepository extends JpaRepository<Farm, Long> {

    List<Farm> findByFarmerId(Long farmerId);

    Optional<Farm> findByIdAndFarmerId(Long id, Long farmerId);
}
