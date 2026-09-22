package com.agrigrade.market.dto;

import java.math.BigDecimal;

public record MarketTrendDayDto(
    String date,
    String dateLabel,
    BigDecimal pricePerKg
) {}
