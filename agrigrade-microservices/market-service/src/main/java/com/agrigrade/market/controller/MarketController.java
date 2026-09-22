package com.agrigrade.market.controller;

import com.agrigrade.market.dto.MarketRateResponse;
import com.agrigrade.market.dto.MarketRecommendationRequest;
import com.agrigrade.market.dto.MarketRecommendationResponse;
import com.agrigrade.market.dto.MarketResponse;
import com.agrigrade.market.service.MarketRecommendationService;
import com.agrigrade.market.service.MarketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class MarketController {

    private final MarketService marketService;
    private final MarketRecommendationService recommendationService;
    private final com.agrigrade.market.service.QualityAwarePriceService pricePredictionService;

    public MarketController(
            MarketService marketService,
            MarketRecommendationService recommendationService,
            com.agrigrade.market.service.QualityAwarePriceService pricePredictionService
    ) {
        this.marketService = marketService;
        this.recommendationService = recommendationService;
        this.pricePredictionService = pricePredictionService;
    }

    @GetMapping("/api/v1/markets")
    public ResponseEntity<List<MarketResponse>> getMarkets() {
        return ResponseEntity.ok(marketService.getAllMarkets());
    }

    @GetMapping({"/api/v1/rates", "/rates", "/api/v1/markets/rates"})
    public ResponseEntity<List<MarketRateResponse>> getMarketRates(
            @RequestParam(name = "varietyId", required = false) Long varietyId,
            @RequestParam(name = "district", required = false) String district
    ) {
        return ResponseEntity.ok(marketService.getMarketRates(varietyId, district));
    }

    @PostMapping("/api/v1/markets/recommendations")
    public ResponseEntity<List<MarketRecommendationResponse>> getRecommendations(
            @RequestBody MarketRecommendationRequest request
    ) {
        return ResponseEntity.ok(recommendationService.generateRecommendations(request));
    }

    @PostMapping("/api/v1/market/price-prediction")
    public ResponseEntity<com.agrigrade.market.dto.PricePredictionResponse> predictPrice(
            @RequestBody com.agrigrade.market.dto.PricePredictionRequest request
    ) {
        return ResponseEntity.ok(pricePredictionService.predictPrice(request));
    }
}
