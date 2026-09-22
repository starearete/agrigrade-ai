package com.agrigrade.chat.dto;

public record ChatMessageResponse(
    Long id,
    String publicId,
    Long conversationId,
    String conversationPublicId,
    Long senderUserId,
    String senderName,
    String senderRole,
    Long recipientUserId,
    String recipientName,
    String messageType,
    String content,
    String clientMessageId,
    String sentAt,
    String deliveredAt,
    String readAt,
    String status,
    Long listingId,
    String cropName,
    String varietyName,
    Long purchaseRequestId
) {
    // Backward-compatible constructor
    public ChatMessageResponse(
        Long id,
        String publicId,
        Long conversationId,
        String conversationPublicId,
        Long senderUserId,
        String senderName,
        String senderRole,
        Long recipientUserId,
        String recipientName,
        String messageType,
        String content,
        String clientMessageId,
        String sentAt,
        String deliveredAt,
        String readAt,
        String status
    ) {
        this(id, publicId, conversationId, conversationPublicId, senderUserId, senderName, senderRole, recipientUserId, recipientName, messageType, content, clientMessageId, sentAt, deliveredAt, readAt, status, null, null, null, null);
    }
}
