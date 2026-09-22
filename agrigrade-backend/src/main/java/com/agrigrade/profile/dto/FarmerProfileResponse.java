package com.agrigrade.profile.dto;

import java.math.BigDecimal;

public record FarmerProfileResponse(
    Long id,
    Long userId,
    String publicId,
    String farmerCode,
    String fullName,
    String email,
    String mobileNumber,
    String kisanCreditCardNo,
    BigDecimal totalLandAcres,
    AddressResponse primaryAddress,
    String createdAt
) {}
