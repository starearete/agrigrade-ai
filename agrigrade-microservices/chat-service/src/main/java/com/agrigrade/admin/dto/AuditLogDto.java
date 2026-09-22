package com.agrigrade.admin.dto;

public record AuditLogDto(
        Long id,
        Long adminUserId,
        String adminEmail,
        String adminName,
        Long targetUserId,
        String targetUserName,
        String actionCode,
        String reason,
        String executedAt
) {}
