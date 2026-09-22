package com.agrigrade.profile.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record FarmRequest(
    @NotBlank(message = "Farm name is required")
    String farmName,

    @NotNull(message = "Farm area in acres is required")
    BigDecimal areaAcres,

    String soilType,

    String irrigationType,

    Boolean isActive,

    @Valid
    AddressRequest address
) {}
