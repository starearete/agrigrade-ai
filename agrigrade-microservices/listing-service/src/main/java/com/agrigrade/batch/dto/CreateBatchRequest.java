package com.agrigrade.batch.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateBatchRequest(
    Long cropId,

    @NotNull(message = "Variety ID is required")
    Long varietyId,

    @NotBlank(message = "Harvest date is required")
    String harvestDate,

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.001", message = "Quantity must be greater than zero")
    BigDecimal quantity,

    String quantityUnit,

    @NotBlank(message = "District is required")
    String district,

    String state,

    String storageCondition,

    String coverImageUrl
) {}
