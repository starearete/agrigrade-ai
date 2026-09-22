package com.agrigrade.admin.dto;

public record ListingModerationRequest(
        String status,
        String reason
) {}
