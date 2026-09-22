package com.agrigrade.market.dto;

import java.math.BigDecimal;

public record MarketResponse(
    Long id,
    String code,
    String name,
    String marketType,
    String district,
    String state,
    BigDecimal latitude,
    BigDecimal longitude
) {}
