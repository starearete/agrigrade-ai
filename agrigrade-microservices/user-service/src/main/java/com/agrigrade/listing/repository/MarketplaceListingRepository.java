package com.agrigrade.listing.repository;

import com.agrigrade.listing.entity.MarketplaceListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface MarketplaceListingRepository extends JpaRepository<MarketplaceListing, Long> {

    Optional<MarketplaceListing> findFirstByBatchIdOrderByListedAtDesc(Long batchId);

    Optional<MarketplaceListing> findByBatchIdAndStatus(Long batchId, String status);

    List<MarketplaceListing> findAllByBatchIdOrderByListedAtDesc(Long batchId);

    boolean existsByBatchIdAndStatus(Long batchId, String status);

    List<MarketplaceListing> findByStatusOrderByListedAtDesc(String status);

    @Query("SELECT ml FROM MarketplaceListing ml JOIN ml.batch pb JOIN pb.farmer fp WHERE fp.userId = :userId AND ml.status = :status ORDER BY ml.listedAt DESC")
    List<MarketplaceListing> findByFarmerUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);

    @Query("SELECT ml FROM MarketplaceListing ml JOIN FETCH ml.batch pb JOIN FETCH pb.variety cv JOIN FETCH cv.crop c JOIN FETCH pb.farmer fp WHERE ml.status = 'ACTIVE' AND ml.quantityRemaining > 0 ORDER BY ml.listedAt DESC")
    List<MarketplaceListing> findAllActiveWithDetails();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE MarketplaceListing ml
        SET
            ml.quantityRemaining = ml.quantityRemaining - :qty,
            ml.status =
                CASE
                    WHEN ml.quantityRemaining - :qty <= 0
                    THEN 'SOLD_OUT'
                    ELSE ml.status
                END
        WHERE
            ml.id = :id
            AND ml.quantityRemaining >= :qty
            AND ml.status = 'ACTIVE'
        """)
    int decrementQuantityRemaining(@Param("id") Long id, @Param("qty") BigDecimal qty);
}
