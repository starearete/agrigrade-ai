package com.agrigrade.batch.repository;

import com.agrigrade.batch.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {
    List<ProductBatch> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    Optional<ProductBatch> findByIdAndFarmerId(Long id, Long farmerId);
    Optional<ProductBatch> findByBatchNumber(String batchNumber);
}
