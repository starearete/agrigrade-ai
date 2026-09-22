package com.agrigrade.profile.repository;

import com.agrigrade.profile.entity.BuyerProcurementCrop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuyerProcurementCropRepository extends JpaRepository<BuyerProcurementCrop, Long> {
    List<BuyerProcurementCrop> findByBuyerProfileId(Long buyerProfileId);
    void deleteByBuyerProfileId(Long buyerProfileId);
}
