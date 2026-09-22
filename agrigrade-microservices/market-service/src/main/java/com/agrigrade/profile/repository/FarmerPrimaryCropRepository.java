package com.agrigrade.profile.repository;

import com.agrigrade.profile.entity.FarmerPrimaryCrop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FarmerPrimaryCropRepository extends JpaRepository<FarmerPrimaryCrop, Long> {
    List<FarmerPrimaryCrop> findByFarmerProfileId(Long farmerProfileId);
    void deleteByFarmerProfileId(Long farmerProfileId);
}
