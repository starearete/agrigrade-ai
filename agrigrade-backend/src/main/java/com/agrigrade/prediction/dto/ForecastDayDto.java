package com.agrigrade.prediction.dto;

import java.math.BigDecimal;

public record ForecastDayDto(
    int dayIndex,
    String date,
    String dayLabel,
    BigDecimal predictedPricePerKg,
    BigDecimal minPrice,
    BigDecimal maxPrice,
    BigDecimal expectedMandiArrivalTons,
    String arrivalTrend,
    String advisory
) {}
