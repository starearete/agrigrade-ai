package com.agrigrade.ai.repository;

import com.agrigrade.ai.entity.AiCertificate;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiCertificateRepository extends JpaRepository<AiCertificate, Long> {
    @EntityGraph(attributePaths = {"qualityResult"})
    Optional<AiCertificate> findFirstByBatchIdAndStatusOrderByIssuedAtDesc(Long batchId, AiCertificate.Status status);

    @EntityGraph(attributePaths = {"qualityResult"})
    Optional<AiCertificate> findFirstByBatchIdOrderByIssuedAtDesc(Long batchId);

    Optional<AiCertificate> findByBatchId(Long batchId);

    Optional<AiCertificate> findByCertificateNumber(String certificateNumber);
}
