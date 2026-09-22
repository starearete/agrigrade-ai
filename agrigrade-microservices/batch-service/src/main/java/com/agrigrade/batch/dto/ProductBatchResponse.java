package com.agrigrade.batch.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductBatchResponse(
    Long id,
    String batchNumber,
    Long farmerId,
    String farmerName,
    Long cropId,
    String cropName,
    Long varietyId,
    String varietyName,
    String harvestDate,
    BigDecimal quantity,
    String quantityUnit,
    String harvestLocationDistrict,
    String harvestLocationState,
    String storageCondition,
    String status,
    List<BatchImageDto> images,
    Double qualityScore,
    String assignedGrade,
    String certificateNumber,
    String certificateStatus,
    Integer cropAgeDays,
    Double remainingShelfLifeDays,
    Boolean inspectionLocked,
    String inspectionLockedAt,
    String createdAt,
    String updatedAt
) {}
