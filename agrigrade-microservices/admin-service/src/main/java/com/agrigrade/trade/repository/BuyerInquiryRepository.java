package com.agrigrade.trade.repository;

import com.agrigrade.trade.entity.BuyerInquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuyerInquiryRepository extends JpaRepository<BuyerInquiry, Long> {

    @Query("SELECT bi FROM BuyerInquiry bi WHERE bi.buyer.id = :buyerId ORDER BY bi.createdAt DESC")
    List<BuyerInquiry> findByBuyerIdOrderByCreatedAtDesc(@Param("buyerId") Long buyerId);

    @Query("SELECT bi FROM BuyerInquiry bi WHERE bi.listing.batch.farmer.id = :farmerId ORDER BY bi.createdAt DESC")
    List<BuyerInquiry> findByFarmerIdOrderByCreatedAtDesc(@Param("farmerId") Long farmerId);
}
