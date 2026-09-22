package com.agrigrade.listing.dto;

public record ShelfLifeCalculationResult(
    int baseShelfLifeDays,
    double effectiveShelfLifeDays,
    double remainingShelfLifeDays,
    String shelfLifeStatus,
    String assignedGrade,
    double qualityScore,
    String harvestDate,
    int cropAgeDays
) {}
