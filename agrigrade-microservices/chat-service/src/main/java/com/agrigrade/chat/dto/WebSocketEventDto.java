package com.agrigrade.chat.dto;

import java.util.UUID;

public record WebSocketEventDto(
    String eventId,
    String type, // NEW_MESSAGE, MESSAGE_SENT, MESSAGE_DELIVERED, MESSAGE_READ, TYPING, PURCHASE_REQUEST_CREATED, PURCHASE_REQUEST_ACCEPTED, PURCHASE_REQUEST_DECLINED, LISTING_QUANTITY_UPDATED, LISTING_SOLD_OUT, ERROR
    Long conversationId,
    Object payload
) {
    public WebSocketEventDto(String type, Long conversationId, Object payload) {
        this(UUID.randomUUID().toString(), type, conversationId, payload);
    }
}
