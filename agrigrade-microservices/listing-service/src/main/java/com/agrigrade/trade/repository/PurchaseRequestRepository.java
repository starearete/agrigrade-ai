package com.agrigrade.trade.repository;

import com.agrigrade.trade.entity.PurchaseRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {

    @EntityGraph(attributePaths = {"listing", "listing.batch", "listing.batch.variety", "listing.batch.variety.crop", "buyerUser", "farmerUser"})
    Optional<PurchaseRequest> findById(Long id);

    @EntityGraph(attributePaths = {"listing", "listing.batch", "listing.batch.variety", "listing.batch.variety.crop", "buyerUser", "farmerUser"})
    Optional<PurchaseRequest> findByRequestPublicId(String requestPublicId);

    @EntityGraph(attributePaths = {"listing", "listing.batch", "listing.batch.variety", "listing.batch.variety.crop", "buyerUser", "farmerUser"})
    Optional<PurchaseRequest> findByBuyerUserIdAndClientRequestId(Long buyerUserId, String clientRequestId);

    @EntityGraph(attributePaths = {"listing", "listing.batch", "listing.batch.variety", "listing.batch.variety.crop", "buyerUser", "farmerUser"})
    List<PurchaseRequest> findByBuyerUserIdOrderByCreatedAtDesc(Long buyerUserId);

    @EntityGraph(attributePaths = {"listing", "listing.batch", "listing.batch.variety", "listing.batch.variety.crop", "buyerUser", "farmerUser"})
    List<PurchaseRequest> findByFarmerUserIdOrderByCreatedAtDesc(Long farmerUserId);

    @EntityGraph(attributePaths = {"listing", "listing.batch", "listing.batch.variety", "listing.batch.variety.crop", "buyerUser", "farmerUser"})
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.farmerUser.id = :farmerUserId ORDER BY CASE WHEN pr.status = 'PENDING' THEN 0 WHEN pr.status = 'COUNTER_OFFER' THEN 1 ELSE 2 END, pr.createdAt DESC")
    List<PurchaseRequest> findByFarmerUserIdPrioritized(@Param("farmerUserId") Long farmerUserId);

    boolean existsByBuyerUserIdAndListingIdAndStatusIn(Long buyerUserId, Long listingId, Collection<PurchaseRequest.Status> statuses);

    @EntityGraph(attributePaths = {"listing", "listing.batch", "listing.batch.variety", "listing.batch.variety.crop", "buyerUser", "farmerUser"})
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.listing.id = :listingId AND pr.status = 'PENDING'")
    List<PurchaseRequest> findPendingRequestsByListingId(@Param("listingId") Long listingId);
}
