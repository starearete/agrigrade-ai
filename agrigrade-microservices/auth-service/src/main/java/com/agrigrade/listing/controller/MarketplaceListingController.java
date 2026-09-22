package com.agrigrade.listing.controller;

import com.agrigrade.listing.dto.CreateListingRequest;
import com.agrigrade.listing.dto.CreateOrderRequest;
import com.agrigrade.listing.dto.MarketplaceListingResponse;
import com.agrigrade.listing.dto.OrderResponse;
import com.agrigrade.listing.service.MarketplaceListingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class MarketplaceListingController {

    private final MarketplaceListingService listingService;

    public MarketplaceListingController(MarketplaceListingService listingService) {
        this.listingService = listingService;
    }

    @PostMapping({"/batches/{batchId}/listing", "/marketplace/listings/from-batch/{batchId}"})
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<MarketplaceListingResponse> createListing(
            @PathVariable Long batchId,
            @RequestBody(required = false) CreateListingRequest request,
            @RequestParam(value = "askingPrice", required = false) BigDecimal askingPrice,
            @RequestParam(value = "minOrderQuantity", required = false) BigDecimal minOrderQuantity,
            Authentication authentication
    ) {
        String userPublicId = authentication.getName();
        CreateListingRequest effectiveRequest = request;
        if (effectiveRequest == null || effectiveRequest.askingPricePerUnit() == null) {
            effectiveRequest = new CreateListingRequest(
                    askingPrice != null ? askingPrice : BigDecimal.valueOf(25.0),
                    minOrderQuantity != null ? minOrderQuantity : BigDecimal.valueOf(100.0)
            );
        }
        MarketplaceListingResponse response = listingService.createListing(userPublicId, batchId, effectiveRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @RequestMapping(
            value = {"/farmer/listings/{listingId}/withdraw", "/marketplace/listings/{listingId}/withdraw"},
            method = {RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH}
    )
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<MarketplaceListingResponse> withdrawListing(
            @PathVariable Long listingId,
            Authentication authentication
    ) {
        String userPublicId = authentication.getName();
        MarketplaceListingResponse response = listingService.withdrawListing(userPublicId, listingId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping({"/farmer/listings/{listingId}", "/marketplace/listings/{listingId}"})
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<MarketplaceListingResponse> deleteListing(
            @PathVariable Long listingId,
            Authentication authentication
    ) {
        String userPublicId = authentication.getName();
        MarketplaceListingResponse response = listingService.deleteListing(userPublicId, listingId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/marketplace/listings")
    public ResponseEntity<List<MarketplaceListingResponse>> getMarketplaceListings(
            @RequestParam(required = false) String cropName,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String sortBy
    ) {
        List<MarketplaceListingResponse> listings = listingService.getMarketplaceListings(cropName, grade, district, sortBy);
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/marketplace/listings/{listingId}")
    public ResponseEntity<MarketplaceListingResponse> getListingById(@PathVariable Long listingId) {
        MarketplaceListingResponse listing = listingService.getListingById(listingId);
        return ResponseEntity.ok(listing);
    }

    @GetMapping("/farmer/listings")
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<List<MarketplaceListingResponse>> getFarmerListings(Authentication authentication) {
        String userPublicId = authentication.getName();
        List<MarketplaceListingResponse> listings = listingService.getFarmerActiveListings(userPublicId);
        return ResponseEntity.ok(listings);
    }

    @PostMapping("/marketplace/listings/{listingId}/orders")
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    public ResponseEntity<OrderResponse> createOrder(
            @PathVariable Long listingId,
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication
    ) {
        String userPublicId = authentication.getName();
        OrderResponse response = listingService.createPurchaseOrder(userPublicId, listingId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
