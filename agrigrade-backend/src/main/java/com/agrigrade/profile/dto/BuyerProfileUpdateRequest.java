package com.agrigrade.profile.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

public record BuyerProfileUpdateRequest(
    @NotBlank(message = "Full name is required")
    String fullName,

    String mobileNumber,

    @NotBlank(message = "Business name is required")
    String businessName,

    String gstNumber,

    String buyerType,

    @Valid
    AddressRequest primaryAddress
) {}
