package com.agrigrade.crop.dto;

public record CropDto(
    Long id,
    Long categoryId,
    String categoryName,
    String code,
    String name,
    String scientificName,
    Integer baseShelfLifeDays,
    String defaultStorageCondition,
    Boolean isActive
) {}
