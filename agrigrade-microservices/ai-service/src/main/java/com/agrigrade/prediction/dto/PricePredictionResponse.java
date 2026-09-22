package com.agrigrade.prediction.dto;

import java.math.BigDecimal;
import java.util.List;

public record PricePredictionResponse(
    Long id,
    Long batchId,
    String cropName,
    String varietyName,
    String district,
    BigDecimal quantityKg,
    String qualityGrade,
    Double qualityScore,
    Double remainingShelfLifeDays,
    BigDecimal currentPricePerKg,
    BigDecimal predictedPricePerKg,
    BigDecimal priceRangeLow,
    BigDecimal priceRangeHigh,
    BigDecimal peakPrice,
    String peakDate,
    String expectedMandiArrival,
    BigDecimal priceChangeVsCurrent,
    Double priceChangePercent,
    String recommendation,
    String recommendationReason,
    Double confidence,
    List<ForecastDayDto> forecastedPrices,
    String recommendationAdvisory,
    String calculatedAt,
    String generatedAt
) {}
