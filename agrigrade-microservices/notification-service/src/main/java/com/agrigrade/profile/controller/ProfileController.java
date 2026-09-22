package com.agrigrade.profile.controller;

import com.agrigrade.auth.dto.UserDto;
import com.agrigrade.profile.dto.*;
import com.agrigrade.profile.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Object> getProfile(Authentication authentication) {
        String publicId = authentication.getName();
        return ResponseEntity.ok(profileService.getUnifiedProfile(publicId));
    }

    @GetMapping("/completion")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProfileCompletionStatusResponse> getCompletionStatus(Authentication authentication) {
        String publicId = authentication.getName();
        return ResponseEntity.ok(profileService.getCompletionStatus(publicId));
    }

    @GetMapping("/farmer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FullFarmerProfileResponse> getFarmerProfile(Authentication authentication) {
        String publicId = authentication.getName();
        return ResponseEntity.ok(profileService.getFarmerProfile(publicId));
    }

    @PutMapping("/farmer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FullFarmerProfileResponse> saveFarmerProfile(
        Authentication authentication,
        @RequestBody FarmerProfileSaveRequest request
    ) {
        String publicId = authentication.getName();
        return ResponseEntity.ok(profileService.saveFarmerProfile(publicId, request));
    }

    @GetMapping("/buyer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FullBuyerProfileResponse> getBuyerProfile(Authentication authentication) {
        String publicId = authentication.getName();
        return ResponseEntity.ok(profileService.getBuyerProfile(publicId));
    }

    @PutMapping("/buyer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FullBuyerProfileResponse> saveBuyerProfile(
        Authentication authentication,
        @RequestBody BuyerProfileSaveRequest request
    ) {
        String publicId = authentication.getName();
        return ResponseEntity.ok(profileService.saveBuyerProfile(publicId, request));
    }

    @PatchMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> updatePreferences(
        Authentication authentication,
        @RequestBody UserPreferencesRequest request
    ) {
        String publicId = authentication.getName();
        return ResponseEntity.ok(profileService.updatePreferences(publicId, request));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteAccount(Authentication authentication) {
        String publicId = authentication.getName();
        profileService.deleteUserAccountPermanently(publicId);
        return ResponseEntity.noContent().build();
    }
}
