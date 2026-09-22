package com.agrigrade.profile.repository;

import com.agrigrade.profile.entity.FarmerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FarmerProfileRepository extends JpaRepository<FarmerProfile, Long> {

    Optional<FarmerProfile> findByUserId(Long userId);

    boolean existsByFarmerCode(String farmerCode);
}
