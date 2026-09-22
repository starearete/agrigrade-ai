package com.agrigrade.prediction.repository;

import com.agrigrade.prediction.entity.PricePrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PricePredictionRepository extends JpaRepository<PricePrediction, Long> {
    Optional<PricePrediction> findFirstByBatchIdOrderByCalculatedAtDesc(Long batchId);
}
