package com.agrigrade.market.service;

import com.agrigrade.market.dto.MarketRateResponse;
import com.agrigrade.market.dto.PricePredictionRequest;
import com.agrigrade.market.dto.PricePredictionResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class QualityAwarePriceService {

    private final MarketService marketService;

    public QualityAwarePriceService(MarketService marketService) {
        this.marketService = marketService;
    }

    public PricePredictionResponse predictPrice(PricePredictionRequest req) {
        if (req == null || req.crop() == null || req.crop().isBlank()) {
            return new PricePredictionResponse(
                "INVALID_REQUEST",
                null, null, null, null, null, null, 0.0,
                new PricePredictionResponse.ActionRecommendationDto("REJECT", "Crop name is required for price prediction.")
            );
        }

        String cropName = req.crop().trim().toLowerCase();
        String grade = req.grade() != null ? req.grade().toUpperCase().trim() : "B";
        if (grade.equals("GRADE A") || grade.equals("GRADE_A")) grade = "A";
        if (grade.equals("GRADE B") || grade.equals("GRADE_B")) grade = "B";
        if (grade.equals("GRADE C") || grade.equals("GRADE_C")) grade = "C";

        if ("REJECT".equals(grade)) {
            return new PricePredictionResponse(
                "REJECTED_NO_SALE",
                new PricePredictionResponse.ProductInfoDto(req.crop(), req.variety(), "REJECT", req.qualityScore()),
                null,
                new PricePredictionResponse.QualityAdjDto("REJECT", 0.0, "Produce is severely damaged or non-marketable."),
                null, null, null, 0.0,
                new PricePredictionResponse.ActionRecommendationDto("REJECT", "Do not list for normal market sale due to rot/decay.")
            );
        }

        String district = req.location() != null ? req.location().district() : "Coimbatore";
        List<MarketRateResponse> rates = marketService.getMarketRates(null, district);

        if (rates.isEmpty()) {
            return new PricePredictionResponse(
                "PRICE_DATA_UNAVAILABLE",
                new PricePredictionResponse.ProductInfoDto(req.crop(), req.variety(), grade, req.qualityScore()),
                null, null, null, null, null, 0.0,
                new PricePredictionResponse.ActionRecommendationDto("MONITOR", "Current market price data could not be retrieved for location.")
            );
        }

        MarketRateResponse rate = rates.get(0);
        double modalPrice = rate.modalPricePerKg() != null ? rate.modalPricePerKg().doubleValue() : 28.50;
        double minPrice = rate.minPricePerKg() != null ? rate.minPricePerKg().doubleValue() : modalPrice * 0.85;
        double maxPrice = rate.maxPricePerKg() != null ? rate.maxPricePerKg().doubleValue() : modalPrice * 1.15;

        // Base quality multipliers
        double adjPercent = 0.0;
        double multLow = 0.95;
        double multHigh = 1.05;
        String action = "MONITOR";
        String adjReason = "Standard market baseline rate";

        if ("A".equals(grade)) {
            adjPercent = 8.0;
            multLow = 1.05;
            multHigh = 1.15;
            action = "SELL_NOW";
            adjReason = "Premium Grade A visual quality with minimal defects (+8% expected premium)";
        } else if ("B".equals(grade)) {
            adjPercent = 0.0;
            multLow = 0.95;
            multHigh = 1.03;
            action = "SELL_NOW";
            adjReason = "Standard Grade B commercial quality matching mandi modal reference";
        } else if ("C".equals(grade)) {
            adjPercent = -15.0;
            multLow = 0.75;
            multHigh = 0.88;
            action = "MONITOR";
            adjReason = "Discount Grade C quality due to cosmetic/maturity defects (-15% adjustment)";
        }

        double recLow = Math.round(modalPrice * multLow * 100.0) / 100.0;
        double recHigh = Math.round(modalPrice * multHigh * 100.0) / 100.0;

        return new PricePredictionResponse(
            "SUCCESS",
            new PricePredictionResponse.ProductInfoDto(req.crop(), req.variety(), grade, req.qualityScore()),
            new PricePredictionResponse.MarketRefDto(
                rate.marketName() != null ? rate.marketName() : "Coimbatore Wholesale APMC",
                district,
                "Tamil Nadu",
                minPrice,
                maxPrice,
                modalPrice,
                "₹/kg",
                "INR",
                "AGMARKNET / AgriGrade Mandi Network",
                LocalDate.now().toString()
            ),
            new PricePredictionResponse.QualityAdjDto(grade, adjPercent, adjReason),
            new PricePredictionResponse.RecommendedPriceDto(recLow, recHigh, "₹/kg", "INR"),
            new PricePredictionResponse.TrendDto(
                "A".equals(grade) ? "RISING" : "STABLE",
                "7 days",
                0.78
            ),
            new PricePredictionResponse.ForecastDto(
                true,
                Math.round(recHigh * 1.02 * 100.0) / 100.0,
                "3-7 days",
                0.72
            ),
            0.82,
            new PricePredictionResponse.ActionRecommendationDto(
                action,
                "A".equals(grade) ? "High market demand for Grade A produce. Recommended to sell immediately for best price." : "Market conditions stable. Proceed with standard listing."
            )
        );
    }
}
