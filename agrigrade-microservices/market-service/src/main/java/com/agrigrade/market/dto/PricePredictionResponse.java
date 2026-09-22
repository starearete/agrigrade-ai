package com.agrigrade.market.dto;

public record PricePredictionResponse(
    String status,
    ProductInfoDto product,
    MarketRefDto marketReference,
    QualityAdjDto qualityAdjustment,
    RecommendedPriceDto recommendedPrice,
    TrendDto trend,
    ForecastDto forecast,
    Double priceConfidence,
    ActionRecommendationDto recommendation
) {
    public record ProductInfoDto(
        String crop,
        String variety,
        String grade,
        Double qualityScore
    ) {}

    public record MarketRefDto(
        String market,
        String district,
        String state,
        Double minPrice,
        Double maxPrice,
        Double modalPrice,
        String unit,
        String currency,
        String source,
        String date
    ) {}

    public record QualityAdjDto(
        String grade,
        Double adjustmentPercent,
        String reason
    ) {}

    public record RecommendedPriceDto(
        Double low,
        Double high,
        String unit,
        String currency
    ) {}

    public record TrendDto(
        String direction,
        String period,
        Double confidence
    ) {}

    public record ForecastDto(
        boolean available,
        Double price,
        String horizon,
        Double confidence
    ) {}

    public record ActionRecommendationDto(
        String bestAction,
        String reason
    ) {}
}
