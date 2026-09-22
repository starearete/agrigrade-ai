package com.agrigrade.profile.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record FarmerProfileUpdateRequest(
    @NotBlank(message = "Full name is required")
    String fullName,

    String mobileNumber,

    String kisanCreditCardNo,

    BigDecimal totalLandAcres,

    @Valid
    AddressRequest primaryAddress
) {}
