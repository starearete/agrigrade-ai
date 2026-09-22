package com.agrigrade.ai.repository;

import com.agrigrade.ai.entity.AiAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiAnalysisRepository extends JpaRepository<AiAnalysis, Long> {
    Optional<AiAnalysis> findFirstByBatchIdOrderByStartedAtDesc(Long batchId);
    Optional<AiAnalysis> findFirstByBatchIdAndStatusOrderByStartedAtDesc(Long batchId, AiAnalysis.Status status);
}
