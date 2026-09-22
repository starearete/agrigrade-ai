package com.agrigrade.listing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateOrderRequest(
    @NotNull(message = "Requested quantity is required")
    @DecimalMin(value = "0.001", message = "Requested quantity must be greater than zero")
    BigDecimal requestedQuantity,

    BigDecimal offeredPricePerUnit,

    String deliveryPreference,

    String notes
) {}
