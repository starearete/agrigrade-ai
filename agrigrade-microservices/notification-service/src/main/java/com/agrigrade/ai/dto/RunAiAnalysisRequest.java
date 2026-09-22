package com.agrigrade.ai.dto;

public record RunAiAnalysisRequest(
    Integer sampleSize,
    String notes,
    Boolean simulateCropMismatch,
    Boolean simulateLowConfidence,
    String simulateGrade
) {}
