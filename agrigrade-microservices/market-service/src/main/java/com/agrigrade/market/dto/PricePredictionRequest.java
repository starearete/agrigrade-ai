package com.agrigrade.market.dto;

public record PricePredictionRequest(
    String crop,
    String variety,
    String grade,
    Double qualityScore,
    String maturity,
    LocationDto location
) {
    public record LocationDto(
        String state,
        String district,
        String market
    ) {}
}
