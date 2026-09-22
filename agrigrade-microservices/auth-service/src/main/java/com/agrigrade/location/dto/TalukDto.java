package com.agrigrade.location.dto;

public record TalukDto(
    Long id,
    Long districtId,
    String name,
    String code
) {}
