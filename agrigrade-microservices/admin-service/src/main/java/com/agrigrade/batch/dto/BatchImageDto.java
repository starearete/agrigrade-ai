package com.agrigrade.batch.dto;

public record BatchImageDto(
    Long id,
    Long batchId,
    String imageUrl,
    Integer sequenceNo,
    String sha256Hash,
    String mediaType,
    String capturedAt
) {}
