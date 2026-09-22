package com.agrigrade.trade.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CounterOfferRequestDto(
        @NotNull @Positive BigDecimal counterQuantity,
        @NotNull @Positive BigDecimal counterPricePerKg,
        String message
) {}
