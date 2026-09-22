package com.agrigrade.ai.repository;

import com.agrigrade.ai.entity.QualityResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QualityResultRepository extends JpaRepository<QualityResult, Long> {
    Optional<QualityResult> findByAnalysisId(Long analysisId);
}
