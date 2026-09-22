package com.agrigrade.profile.controller;

import com.agrigrade.profile.dto.FarmRequest;
import com.agrigrade.profile.dto.FarmResponse;
import com.agrigrade.profile.service.FarmService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profiles/farms")
public class FarmController {

    private final FarmService farmService;

    public FarmController(FarmService farmService) {
        this.farmService = farmService;
    }

    @PostMapping
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<FarmResponse> createFarm(
            Authentication authentication,
            @Valid @RequestBody FarmRequest request
    ) {
        String publicId = authentication.getName();
        FarmResponse response = farmService.createFarm(publicId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<List<FarmResponse>> getFarms(Authentication authentication) {
        String publicId = authentication.getName();
        List<FarmResponse> response = farmService.getFarms(publicId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<FarmResponse> getFarmById(
            Authentication authentication,
            @PathVariable("id") Long farmId
    ) {
        String publicId = authentication.getName();
        FarmResponse response = farmService.getFarmById(publicId, farmId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<FarmResponse> updateFarm(
            Authentication authentication,
            @PathVariable("id") Long farmId,
            @Valid @RequestBody FarmRequest request
    ) {
        String publicId = authentication.getName();
        FarmResponse response = farmService.updateFarm(publicId, farmId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFarm(
            Authentication authentication,
            @PathVariable("id") Long farmId
    ) {
        String publicId = authentication.getName();
        farmService.deleteFarm(publicId, farmId);
        return ResponseEntity.noContent().build();
    }
}
