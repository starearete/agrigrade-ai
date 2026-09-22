package com.agrigrade.chat.controller;

import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.chat.dto.*;
import com.agrigrade.chat.entity.Conversation;
import com.agrigrade.chat.repository.ConversationRepository;
import com.agrigrade.chat.service.ChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

@Controller
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;

    public ChatWebSocketController(
            ChatService chatService,
            SimpMessagingTemplate messagingTemplate,
            UserRepository userRepository,
            ConversationRepository conversationRepository
    ) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
        this.conversationRepository = conversationRepository;
    }

    @MessageMapping("/chat.send")
    public void processMessage(@Payload SendMessageRequest req, Principal principal) {
        if (principal == null) return;
        String userPublicId = principal.getName();

        try {
            ChatMessageResponse saved = chatService.sendMessage(userPublicId, req);
            String eventId = UUID.randomUUID().toString();
            WebSocketEventDto event = new WebSocketEventDto(eventId, "NEW_MESSAGE", saved.conversationId(), saved);

            // Send acknowledgment to sender
            messagingTemplate.convertAndSendToUser(userPublicId, "/queue/messages", new WebSocketEventDto(eventId, "MESSAGE_SENT", saved.conversationId(), saved));

            // Send message to recipient private queue
            Optional<User> recipientOpt = userRepository.findById(saved.recipientUserId());
            if (recipientOpt.isPresent()) {
                String recipientPublicId = recipientOpt.get().getPublicId();
                messagingTemplate.convertAndSendToUser(recipientPublicId, "/queue/messages", event);
            }

            // Also broadcast on topic for active conversation subscribers
            messagingTemplate.convertAndSend("/topic/conversations." + saved.conversationId(), event);
        } catch (Exception e) {
            WebSocketEventDto errorEvent = new WebSocketEventDto("ERROR", req.conversationId(), e.getMessage());
            messagingTemplate.convertAndSendToUser(userPublicId, "/queue/messages", errorEvent);
        }
    }

    @MessageMapping("/chat.typing")
    public void processTyping(@Payload TypingEventRequest req, Principal principal) {
        if (principal == null || req.conversationId() == null) return;
        String userPublicId = principal.getName();

        Optional<Conversation> convOpt = conversationRepository.findById(req.conversationId());
        if (convOpt.isEmpty()) return;
        Conversation conv = convOpt.get();

        User sender = userRepository.findByPublicId(userPublicId).orElse(null);
        if (sender == null) return;

        User recipient = conv.getFarmer().getId().equals(sender.getId()) ? conv.getBuyer() : conv.getFarmer();

        String eventId = UUID.randomUUID().toString();
        WebSocketEventDto typingEvent = new WebSocketEventDto(eventId, "TYPING", req.conversationId(), req);
        messagingTemplate.convertAndSendToUser(recipient.getPublicId(), "/queue/messages", typingEvent);
        messagingTemplate.convertAndSend("/topic/conversations." + req.conversationId(), typingEvent);
    }

    @MessageMapping("/chat.read")
    public void processRead(@Payload ReadMessageRequest req, Principal principal) {
        if (principal == null || req.conversationId() == null) return;
        String userPublicId = principal.getName();

        chatService.markMessagesAsRead(userPublicId, req.conversationId());

        Optional<Conversation> convOpt = conversationRepository.findById(req.conversationId());
        if (convOpt.isEmpty()) return;
        Conversation conv = convOpt.get();

        User sender = userRepository.findByPublicId(userPublicId).orElse(null);
        if (sender == null) return;

        User otherUser = conv.getFarmer().getId().equals(sender.getId()) ? conv.getBuyer() : conv.getFarmer();

        String eventId = UUID.randomUUID().toString();
        WebSocketEventDto readEvent = new WebSocketEventDto(eventId, "MESSAGE_READ", req.conversationId(), req);
        messagingTemplate.convertAndSendToUser(otherUser.getPublicId(), "/queue/messages", readEvent);
        messagingTemplate.convertAndSend("/topic/conversations." + req.conversationId(), readEvent);
    }

    @MessageMapping("/chat.delivered")
    public void processDelivered(Principal principal) {
        if (principal == null) return;
        String userPublicId = principal.getName();

        chatService.markMessagesAsDelivered(userPublicId);
    }
}
