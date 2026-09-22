package com.agrigrade.trade.controller;

import com.agrigrade.trade.dto.*;
import com.agrigrade.trade.service.TradeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PurchaseRequestController {

    private final TradeService tradeService;

    public PurchaseRequestController(TradeService tradeService) {
        this.tradeService = tradeService;
    }

    @PostMapping({"/purchase-requests", "/trade/requests"})
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    public ResponseEntity<PurchaseRequestResponse> createPurchaseRequest(
            @Valid @RequestBody CreatePurchaseRequestDto requestDto,
            Authentication authentication
    ) {
        String userPublicId = authentication.getName();
        PurchaseRequestResponse response = tradeService.createPurchaseRequest(userPublicId, requestDto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping({"/buyer/purchase-requests", "/purchase-requests/buyer", "/trade/requests/buyer"})
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    public ResponseEntity<List<PurchaseRequestResponse>> getBuyerPurchaseRequests(Authentication authentication) {
        String userPublicId = authentication.getName();
        List<PurchaseRequestResponse> responses = tradeService.getBuyerPurchaseRequests(userPublicId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping({"/farmer/purchase-requests", "/purchase-requests/farmer", "/trade/requests/farmer"})
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<List<PurchaseRequestResponse>> getFarmerPurchaseRequests(Authentication authentication) {
        String userPublicId = authentication.getName();
        List<PurchaseRequestResponse> responses = tradeService.getFarmerPurchaseRequests(userPublicId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping({"/purchase-requests/{id}", "/trade/requests/{id}"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PurchaseRequestResponse> getPurchaseRequestDetail(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String userPublicId = authentication.getName();
        PurchaseRequestResponse response = tradeService.getPurchaseRequestDetail(userPublicId, id);
        return ResponseEntity.ok(response);
    }

    @RequestMapping(
            value = {"/farmer/purchase-requests/{id}/accept", "/purchase-requests/{id}/accept", "/trade/requests/{id}/accept"},
            method = {RequestMethod.POST, RequestMethod.PUT}
    )
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<PurchaseRequestResponse> acceptPurchaseRequest(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String userPublicId = authentication.getName();
        PurchaseRequestResponse response = tradeService.acceptPurchaseRequest(userPublicId, id);
        return ResponseEntity.ok(response);
    }

    @RequestMapping(
            value = {
                "/farmer/purchase-requests/{id}/reject", "/purchase-requests/{id}/reject", "/trade/requests/{id}/reject",
                "/farmer/purchase-requests/{id}/decline", "/purchase-requests/{id}/decline", "/trade/requests/{id}/decline"
            },
            method = {RequestMethod.POST, RequestMethod.PUT}
    )
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<PurchaseRequestResponse> rejectPurchaseRequest(
            @PathVariable Long id,
            @RequestBody(required = false) RejectRequestDto rejectDto,
            Authentication authentication
    ) {
        String userPublicId = authentication.getName();
        PurchaseRequestResponse response = tradeService.rejectPurchaseRequest(userPublicId, id, rejectDto);
        return ResponseEntity.ok(response);
    }

    @RequestMapping(
            value = {"/farmer/purchase-requests/{id}/counter", "/purchase-requests/{id}/counter", "/trade/requests/{id}/counter"},
            method = {RequestMethod.POST, RequestMethod.PUT}
    )
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<PurchaseRequestResponse> counterPurchaseRequest(
            @PathVariable Long id,
            @Valid @RequestBody CounterOfferRequestDto counterDto,
            Authentication authentication
    ) {
        String userPublicId = authentication.getName();
        PurchaseRequestResponse response = tradeService.counterPurchaseRequest(userPublicId, id, counterDto);
        return ResponseEntity.ok(response);
    }

    @RequestMapping(
            value = {"/buyer/purchase-requests/{id}/accept-counter", "/purchase-requests/{id}/accept-counter", "/trade/requests/{id}/accept-counter"},
            method = {RequestMethod.POST, RequestMethod.PUT}
    )
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    public ResponseEntity<PurchaseRequestResponse> acceptCounterOffer(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String userPublicId = authentication.getName();
        PurchaseRequestResponse response = tradeService.acceptCounterOffer(userPublicId, id);
        return ResponseEntity.ok(response);
    }

    @RequestMapping(
            value = {"/buyer/purchase-requests/{id}/cancel", "/purchase-requests/{id}/cancel", "/trade/requests/{id}/cancel"},
            method = {RequestMethod.POST, RequestMethod.PUT}
    )
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    public ResponseEntity<PurchaseRequestResponse> cancelPurchaseRequest(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String userPublicId = authentication.getName();
        PurchaseRequestResponse response = tradeService.cancelPurchaseRequest(userPublicId, id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/marketplace/nearby-buyers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NearbyBuyerDto>> getNearbyBuyers(Authentication authentication) {
        String userPublicId = authentication.getName();
        List<NearbyBuyerDto> list = tradeService.getNearbyBuyersForFarmer(userPublicId);
        return ResponseEntity.ok(list);
    }
}
