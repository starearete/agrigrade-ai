package com.agrigrade.crop.dto;

public record CreateVarietyRequest(
    String code,
    String name,
    String scientificName,
    Boolean isActive
) {}
