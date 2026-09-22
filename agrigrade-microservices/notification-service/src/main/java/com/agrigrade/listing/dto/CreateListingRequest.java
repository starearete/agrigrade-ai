package com.agrigrade.listing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateListingRequest(
        @NotNull(message = "Asking price is required")
        @DecimalMin(value = "0.01", message = "Asking price must be greater than zero")
        BigDecimal askingPricePerUnit,

        @DecimalMin(value = "0.001", message = "Minimum order quantity must be greater than zero")
        BigDecimal minimumOrderQuantity
) {}
