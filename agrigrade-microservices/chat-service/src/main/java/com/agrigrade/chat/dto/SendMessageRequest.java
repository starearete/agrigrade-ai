package com.agrigrade.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
    @NotNull(message = "conversationId is required")
    Long conversationId,
    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 2000, message = "Message content cannot exceed 2000 characters")
    String content,
    String clientMessageId,
    Long listingId,
    String cropName,
    String varietyName,
    String messageType
) {
    public SendMessageRequest(Long conversationId, String content, String clientMessageId) {
        this(conversationId, content, clientMessageId, null, null, null, "TEXT");
    }
}
