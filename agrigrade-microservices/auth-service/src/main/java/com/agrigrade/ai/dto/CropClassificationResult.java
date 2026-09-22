package com.agrigrade.ai.dto;

public record CropClassificationResult(
    String detectedCropName,
    Double confidenceScore,
    Boolean isMatch
) {}
