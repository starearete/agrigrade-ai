package com.agrigrade.profile.dto;

import com.agrigrade.crop.dto.CropDto;
import java.math.BigDecimal;
import java.util.List;

public record FullFarmerProfileResponse(
    Long id,
    Long userId,
    String publicId,
    String farmerCode,
    String fullName,
    String email,
    String mobileNumber,
    String kisanCreditCardNo,
    BigDecimal totalLandAcres,
    AddressDto contactAddress,
    AddressDto farmAddress,
    Boolean farmSameAsContact,
    List<CropDto> primaryCrops,
    Boolean profileCompleted,
    String preferredLanguage,
    String preferredTheme,
    String createdAt
) {}
