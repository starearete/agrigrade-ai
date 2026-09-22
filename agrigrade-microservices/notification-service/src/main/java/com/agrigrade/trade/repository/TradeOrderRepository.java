package com.agrigrade.trade.repository;

import com.agrigrade.trade.entity.TradeOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeOrderRepository extends JpaRepository<TradeOrder, Long> {

    @EntityGraph(attributePaths = {"listing", "listing.batch", "listing.batch.variety", "listing.batch.variety.crop", "buyer", "farmer"})
    @Query("SELECT o FROM TradeOrder o WHERE o.buyer.id = :buyerId ORDER BY o.createdAt DESC")
    List<TradeOrder> findByBuyerIdOrderByCreatedAtDesc(@Param("buyerId") Long buyerId);

    @EntityGraph(attributePaths = {"listing", "listing.batch", "listing.batch.variety", "listing.batch.variety.crop", "buyer", "farmer"})
    @Query("SELECT o FROM TradeOrder o WHERE o.farmer.id = :farmerId ORDER BY o.createdAt DESC")
    List<TradeOrder> findByFarmerIdOrderByCreatedAtDesc(@Param("farmerId") Long farmerId);
}
