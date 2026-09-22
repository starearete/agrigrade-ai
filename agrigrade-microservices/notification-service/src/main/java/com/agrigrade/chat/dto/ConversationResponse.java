package com.agrigrade.chat.dto;

import java.time.LocalDateTime;

public record ConversationResponse(
    Long id,
    String publicId,
    Long farmerUserId,
    String farmerName,
    Long buyerUserId,
    String buyerName,
    Long listingId,
    String listingCropName,
    String listingVarietyName,
    String listingQualityGrade,
    Double listingPrice,
    Double listingQuantityKg,
    Double remainingShelfLifeDays,
    String listingStatus,
    String lastMessageText,
    String lastMessageTime,
    long unreadCount,
    String status,
    String createdAt
) {}
