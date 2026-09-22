package com.agrigrade.crop.dto;

public record CropVarietyDto(
    Long id,
    Long cropId,
    String cropName,
    String code,
    String name,
    String scientificName,
    Boolean isActive
) {}
