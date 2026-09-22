package com.agrigrade.notification.dto;

public record NotificationResponse(
        Long id,
        Long userId,
        String title,
        String body,
        String notificationType,
        String referenceType,
        Long referenceId,
        String readAt,
        String createdAt,
        boolean isRead
) {}
