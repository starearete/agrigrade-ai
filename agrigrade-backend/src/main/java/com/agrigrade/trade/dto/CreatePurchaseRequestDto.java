package com.agrigrade.trade.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreatePurchaseRequestDto(
        @NotNull Long listingId,
        @NotNull @Positive BigDecimal requestedQuantity,
        BigDecimal offeredPricePerKg,
        BigDecimal offeredPricePerUnit,
        String buyerMessage,
        String message,
        String clientRequestId
) {
    public BigDecimal getEffectivePrice() {
        if (offeredPricePerKg != null) return offeredPricePerKg;
        if (offeredPricePerUnit != null) return offeredPricePerUnit;
        return BigDecimal.ZERO;
    }

    public String getEffectiveMessage() {
        if (buyerMessage != null && !buyerMessage.isBlank()) return buyerMessage;
        return message;
    }
}
