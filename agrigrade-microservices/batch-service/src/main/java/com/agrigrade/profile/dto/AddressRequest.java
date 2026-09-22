package com.agrigrade.profile.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record AddressRequest(
    @NotBlank(message = "Address line 1 is required")
    String addressLine1,

    String addressLine2,

    String locality,

    @NotBlank(message = "District is required")
    String district,

    String state,

    @NotBlank(message = "Pincode is required")
    String pincode,

    BigDecimal latitude,

    BigDecimal longitude,

    String addressType,

    Boolean isPrimary
) {}
