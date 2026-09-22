package com.agrigrade.chat.dto;

public record TypingEventRequest(
    Long conversationId,
    boolean typing
) {}
