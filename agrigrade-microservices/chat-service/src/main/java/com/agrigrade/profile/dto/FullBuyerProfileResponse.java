package com.agrigrade.profile.dto;

import com.agrigrade.crop.dto.CropDto;
import java.util.List;

public record FullBuyerProfileResponse(
    Long id,
    Long userId,
    String publicId,
    String buyerCode,
    String fullName,
    String email,
    String mobileNumber,
    String businessName,
    String buyerType,
    String gstNumber,
    String businessRegistrationNumber,
    String purchaseCapacity,
    AddressDto businessAddress,
    List<CropDto> procurementCrops,
    Boolean profileCompleted,
    String preferredLanguage,
    String preferredTheme,
    String createdAt
) {}
