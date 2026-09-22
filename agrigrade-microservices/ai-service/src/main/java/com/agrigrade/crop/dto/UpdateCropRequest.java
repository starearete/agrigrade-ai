package com.agrigrade.crop.dto;

public record UpdateCropRequest(
    String name,
    String scientificName,
    Integer baseShelfLifeDays,
    String defaultStorageCondition,
    Boolean isActive
) {}
