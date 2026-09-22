package com.agrigrade.chat.dto;

import java.util.List;

public record ReadMessageRequest(
    Long conversationId,
    List<Long> messageIds
) {}
