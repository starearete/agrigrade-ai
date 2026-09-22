package com.agrigrade.profile.dto;

import java.math.BigDecimal;
import java.util.List;

public record FarmerProfileSaveRequest(
    String fullName,
    String mobileNumber,
    String email,
    String preferredLanguage,
    String preferredTheme,
    AddressDto contactAddress,
    AddressDto farmAddress,
    Boolean farmSameAsContact,
    BigDecimal totalLandAcres,
    List<Long> primaryCropIds,
    String kisanCreditCardNo
) {}
