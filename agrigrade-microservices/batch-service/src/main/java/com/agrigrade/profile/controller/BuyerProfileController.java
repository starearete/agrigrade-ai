package com.agrigrade.profile.controller;

import com.agrigrade.profile.dto.BuyerProfileResponse;
import com.agrigrade.profile.dto.BuyerProfileUpdateRequest;
import com.agrigrade.profile.service.BuyerProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profiles/buyer")
public class BuyerProfileController {

    private final BuyerProfileService buyerProfileService;

    public BuyerProfileController(BuyerProfileService buyerProfileService) {
        this.buyerProfileService = buyerProfileService;
    }

    @GetMapping
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    public ResponseEntity<BuyerProfileResponse> getBuyerProfile(Authentication authentication) {
        String publicId = authentication.getName();
        BuyerProfileResponse response = buyerProfileService.getBuyerProfile(publicId);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    public ResponseEntity<BuyerProfileResponse> updateBuyerProfile(
            Authentication authentication,
            @Valid @RequestBody BuyerProfileUpdateRequest request
    ) {
        String publicId = authentication.getName();
        BuyerProfileResponse response = buyerProfileService.updateBuyerProfile(publicId, request);
        return ResponseEntity.ok(response);
    }
}
