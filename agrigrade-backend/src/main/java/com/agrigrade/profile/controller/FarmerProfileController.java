package com.agrigrade.profile.controller;

import com.agrigrade.profile.dto.FarmerProfileResponse;
import com.agrigrade.profile.dto.FarmerProfileUpdateRequest;
import com.agrigrade.profile.service.FarmerProfileService;
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
@RequestMapping("/api/v1/profiles/farmer")
public class FarmerProfileController {

    private final FarmerProfileService farmerProfileService;

    public FarmerProfileController(FarmerProfileService farmerProfileService) {
        this.farmerProfileService = farmerProfileService;
    }

    @GetMapping
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<FarmerProfileResponse> getFarmerProfile(Authentication authentication) {
        String publicId = authentication.getName();
        FarmerProfileResponse response = farmerProfileService.getFarmerProfile(publicId);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<FarmerProfileResponse> updateFarmerProfile(
            Authentication authentication,
            @Valid @RequestBody FarmerProfileUpdateRequest request
    ) {
        String publicId = authentication.getName();
        FarmerProfileResponse response = farmerProfileService.updateFarmerProfile(publicId, request);
        return ResponseEntity.ok(response);
    }
}
