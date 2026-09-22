package com.agrigrade.chat.dto;

import jakarta.validation.constraints.NotNull;

public record CreateConversationRequest(
    @NotNull(message = "listingId is required")
    Long listingId,
    String initialMessage
) {}
