package com.agrigrade.profile.dto;

import java.util.List;

public record BuyerProfileSaveRequest(
    String fullName,
    String mobileNumber,
    String email,
    String preferredLanguage,
    String preferredTheme,
    String businessName,
    String buyerType,
    AddressDto businessAddress,
    List<Long> procurementCropIds,
    String purchaseCapacity,
    String gstNumber,
    String businessRegistrationNumber
) {}
