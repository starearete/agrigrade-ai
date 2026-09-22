package com.agrigrade.prediction.controller;

import com.agrigrade.prediction.dto.PricePredictionResponse;
import com.agrigrade.prediction.service.PricePredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/predictions/price")
public class PricePredictionController {

    private final PricePredictionService predictionService;

    public PricePredictionController(PricePredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @GetMapping("/{batchId}")
    public ResponseEntity<PricePredictionResponse> getPricePrediction(@PathVariable("batchId") Long batchId) {
        return ResponseEntity.ok(predictionService.predictPriceForBatch(batchId));
    }
}
