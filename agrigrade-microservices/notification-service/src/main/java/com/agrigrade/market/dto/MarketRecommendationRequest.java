package com.agrigrade.market.dto;

import java.math.BigDecimal;

public record MarketRecommendationRequest(
    String cropName,
    String varietyName,
    String qualityGrade,
    BigDecimal quantityKg,
    String district,
    String taluk,
    String harvestDate,
    String sortMode
) {
    public MarketRecommendationRequest(
        String cropName,
        String varietyName,
        String qualityGrade,
        BigDecimal quantityKg,
        String district,
        String harvestDate,
        String sortMode
    ) {
        this(cropName, varietyName, qualityGrade, quantityKg, district, null, harvestDate, sortMode);
    }
}
