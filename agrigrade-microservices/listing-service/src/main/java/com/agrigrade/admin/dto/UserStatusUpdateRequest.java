package com.agrigrade.admin.dto;

public record UserStatusUpdateRequest(
        String status,
        String verificationStatus,
        String reason
) {}
