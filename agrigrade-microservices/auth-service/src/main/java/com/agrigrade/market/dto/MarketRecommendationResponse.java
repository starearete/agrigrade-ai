package com.agrigrade.market.dto;

import java.math.BigDecimal;
import java.util.List;

public record MarketRecommendationResponse(
    Long id,
    Long batchId,
    Long marketId,
    String marketName,
    String district,
    String cropName,
    String varietyName,
    String qualityGrade,
    BigDecimal currentMarketPricePerKg,
    BigDecimal distanceKm,
    Integer estimatedTravelMinutes,
    BigDecimal estimatedTransportCost,
    BigDecimal grossValue,
    BigDecimal estimatedNetRevenue,
    BigDecimal recommendationScore,
    Integer rankOrder,
    String observedAt,
    String generatedAt,
    List<MarketTrendDayDto> priceTrend
) {}
