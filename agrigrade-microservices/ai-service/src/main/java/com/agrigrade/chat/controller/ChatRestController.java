package com.agrigrade.chat.controller;

import com.agrigrade.chat.dto.*;
import com.agrigrade.chat.service.ChatService;
import com.agrigrade.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatRestController {

    private final ChatService chatService;

    public ChatRestController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationResponse>> createConversation(
            Authentication authentication,
            @Valid @RequestBody CreateConversationRequest req
    ) {
        ConversationResponse resp = chatService.getOrCreateConversation(authentication.getName(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(resp, "Conversation ready"));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getUserConversations(
            Authentication authentication
    ) {
        List<ConversationResponse> list = chatService.getUserConversations(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(list, "Conversations retrieved"));
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversationById(
            Authentication authentication,
            @PathVariable Long conversationId
    ) {
        ConversationResponse resp = chatService.getConversationById(authentication.getName(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(resp, "Conversation details retrieved"));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            Authentication authentication,
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Long before
    ) {
        List<ChatMessageResponse> messages = chatService.getConversationMessages(authentication.getName(), conversationId, page, size, before);
        return ResponseEntity.ok(ApiResponse.success(messages, "Messages retrieved"));
    }

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            Authentication authentication,
            @Valid @RequestBody SendMessageRequest req
    ) {
        ChatMessageResponse resp = chatService.sendMessage(authentication.getName(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(resp, "Message sent"));
    }

    @RequestMapping(value = "/conversations/{conversationId}/read", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            Authentication authentication,
            @PathVariable Long conversationId
    ) {
        chatService.markMessagesAsRead(authentication.getName(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(null, "Messages marked as read"));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            Authentication authentication
    ) {
        UnreadCountResponse resp = chatService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(resp, "Unread count retrieved"));
    }

    @RequestMapping(value = {"/conversations/{conversationId}", "/conversations/{conversationId}/delete"}, method = {RequestMethod.DELETE, RequestMethod.POST})
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            Authentication authentication,
            @PathVariable Long conversationId
    ) {
        chatService.deleteConversation(authentication.getName(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(null, "Conversation deleted successfully"));
    }
}
