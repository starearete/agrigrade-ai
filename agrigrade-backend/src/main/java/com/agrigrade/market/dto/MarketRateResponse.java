package com.agrigrade.market.dto;

import java.math.BigDecimal;

public record MarketRateResponse(
    Long id,
    Long marketId,
    String marketName,
    String cropName,
    Long varietyId,
    String varietyName,
    BigDecimal minPricePerKg,
    BigDecimal maxPricePerKg,
    BigDecimal modalPricePerKg,
    BigDecimal quantityArrivedTons,
    String observedAt
) {}
