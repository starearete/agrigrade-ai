package com.agrigrade.batch.repository;

import com.agrigrade.batch.entity.BatchImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchImageRepository extends JpaRepository<BatchImage, Long> {
    List<BatchImage> findByBatchIdOrderBySequenceNoAsc(Long batchId);
}
