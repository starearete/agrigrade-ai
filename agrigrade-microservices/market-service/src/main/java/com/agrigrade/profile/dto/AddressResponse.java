package com.agrigrade.profile.dto;

import java.math.BigDecimal;

public record AddressResponse(
    Long id,
    Long userId,
    String addressType,
    String addressLine1,
    String addressLine2,
    String locality,
    String district,
    String state,
    String pincode,
    BigDecimal latitude,
    BigDecimal longitude,
    Boolean isPrimary
) {}
