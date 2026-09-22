package com.agrigrade.trade.controller;

import com.agrigrade.trade.dto.TradeOrderResponse;
import com.agrigrade.trade.service.TradeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class TradeOrderController {

    private final TradeService tradeService;

    public TradeOrderController(TradeService tradeService) {
        this.tradeService = tradeService;
    }

    @GetMapping({"/buyer/orders", "/orders/buyer"})
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    public ResponseEntity<List<TradeOrderResponse>> getBuyerOrders(Authentication authentication) {
        String userPublicId = authentication.getName();
        List<TradeOrderResponse> responses = tradeService.getBuyerOrders(userPublicId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping({"/farmer/orders", "/orders/farmer"})
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<List<TradeOrderResponse>> getFarmerOrders(Authentication authentication) {
        String userPublicId = authentication.getName();
        List<TradeOrderResponse> responses = tradeService.getFarmerOrders(userPublicId);
        return ResponseEntity.ok(responses);
    }
}
