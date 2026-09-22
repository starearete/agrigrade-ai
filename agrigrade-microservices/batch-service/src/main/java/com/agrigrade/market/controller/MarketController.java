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
@RequestMapping("/api/v1/markets")
public class MarketController {

    private final MarketService marketService;
    private final MarketRecommendationService recommendationService;

    public MarketController(MarketService marketService, MarketRecommendationService recommendationService) {
        this.marketService = marketService;
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public ResponseEntity<List<MarketResponse>> getMarkets() {
        return ResponseEntity.ok(marketService.getAllMarkets());
    }

    @GetMapping("/rates")
    public ResponseEntity<List<MarketRateResponse>> getMarketRates(
            @RequestParam(name = "varietyId", required = false) Long varietyId,
            @RequestParam(name = "district", required = false) String district
    ) {
        return ResponseEntity.ok(marketService.getMarketRates(varietyId, district));
    }

    @PostMapping("/recommendations")
    public ResponseEntity<List<MarketRecommendationResponse>> getRecommendations(@RequestBody MarketRecommendationRequest request) {
        return ResponseEntity.ok(recommendationService.generateRecommendations(request));
    }
}
