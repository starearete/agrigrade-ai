package com.agrigrade.crop.dto;

public record CropCategoryDto(
    Long id,
    String code,
    String name,
    String description
) {}
