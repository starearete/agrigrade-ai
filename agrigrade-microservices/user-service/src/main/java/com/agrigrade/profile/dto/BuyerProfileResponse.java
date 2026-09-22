package com.agrigrade.profile.dto;

public record BuyerProfileResponse(
    Long id,
    Long userId,
    String publicId,
    String buyerCode,
    String fullName,
    String email,
    String mobileNumber,
    String businessName,
    String gstNumber,
    String buyerType,
    AddressResponse primaryAddress,
    String createdAt
) {}
