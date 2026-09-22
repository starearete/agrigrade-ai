package com.agrigrade.admin.controller;

import com.agrigrade.admin.dto.*;
import com.agrigrade.admin.service.AdminService;
import com.agrigrade.listing.entity.MarketplaceListing;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.agrigrade.listing.dto.MarketplaceListingResponse;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<AdminDashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserAdminDto>> getAllUsers(
            @RequestParam(value = "role", required = false, defaultValue = "ALL") String role,
            @RequestParam(value = "district", required = false, defaultValue = "ALL") String district,
            @RequestParam(value = "status", required = false, defaultValue = "ALL") String status,
            @RequestParam(value = "verification", required = false, defaultValue = "ALL") String verification,
            @RequestParam(value = "minAcreage", required = false) Double minAcreage,
            @RequestParam(value = "maxAcreage", required = false) Double maxAcreage,
            @RequestParam(value = "minBuyingCapacity", required = false) Double minBuyingCapacity,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "sort", required = false, defaultValue = "AZ") String sort
    ) {
        return ResponseEntity.ok(adminService.getAllUsers(role, district, status, verification, minAcreage, maxAcreage, minBuyingCapacity, search, sort));
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<UserAdminDto> updateUserStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("userId") Long userId,
            @RequestBody UserStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(adminService.updateUserStatus(userDetails.getUsername(), userId, request));
    }

    @PatchMapping("/listings/{listingId}/moderate")
    public ResponseEntity<MarketplaceListingResponse> moderateListing(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("listingId") Long listingId,
            @RequestBody ListingModerationRequest request
    ) {
        return ResponseEntity.ok(adminService.moderateListing(userDetails.getUsername(), listingId, request));
    }

    @DeleteMapping("/listings/{listingId}")
    public ResponseEntity<Void> deleteListing(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("listingId") Long listingId,
            @RequestParam(value = "reason", required = false, defaultValue = "Listing permanently removed by administrator.") String reason
    ) {
        adminService.deleteListing(userDetails.getUsername(), listingId, reason);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogDto>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }
}
