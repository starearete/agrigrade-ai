package com.agrigrade.profile.dto;

import java.math.BigDecimal;

public record FarmResponse(
    Long id,
    Long farmerId,
    String farmName,
    BigDecimal areaAcres,
    String soilType,
    String irrigationType,
    Boolean isActive,
    AddressResponse address,
    String createdAt
) {}
