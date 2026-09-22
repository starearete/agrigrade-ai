package com.agrigrade.chat.service;

import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.chat.dto.*;
import com.agrigrade.chat.entity.ChatMessage;
import com.agrigrade.chat.entity.Conversation;
import com.agrigrade.chat.repository.ChatMessageRepository;
import com.agrigrade.chat.repository.ConversationRepository;
import com.agrigrade.common.exception.ApiException;
import com.agrigrade.listing.entity.MarketplaceListing;
import com.agrigrade.listing.repository.MarketplaceListingRepository;
import com.agrigrade.notification.service.NotificationService;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final MarketplaceListingRepository listingRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public ChatService(
            ConversationRepository conversationRepository,
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            MarketplaceListingRepository listingRepository,
            NotificationService notificationService,
            @Lazy SimpMessagingTemplate messagingTemplate
    ) {
        this.conversationRepository = conversationRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public ConversationResponse getOrCreateConversation(String userPublicId, CreateConversationRequest req) {
        User buyer = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        if (!buyer.hasRole("BUYER") && !buyer.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "BUYER_REQUIRED", "Only buyers can initiate listing conversations.");
        }

        MarketplaceListing listing = listingRepository.findById(req.listingId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Marketplace listing not found"));

        Long farmerUserId = listing.getBatch().getFarmer().getUserId();
        User farmer = userRepository.findById(farmerUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARMER_NOT_FOUND", "Farmer user not found"));

        // RULE: ONE Farmer + ONE Buyer = ONE Conversation
        Optional<Conversation> existing = conversationRepository.findActiveConversationBetween(farmer.getId(), buyer.getId());
        Conversation conversation;

        if (existing.isPresent()) {
            conversation = existing.get();
            conversation.setListing(listing);
            conversation = conversationRepository.save(conversation);
        } else {
            conversation = new Conversation(farmer, buyer, listing);
            conversation = conversationRepository.save(conversation);
        }

        if (req.initialMessage() != null && !req.initialMessage().trim().isEmpty()) {
            String cropName = (listing.getBatch() != null && listing.getBatch().getVariety() != null && listing.getBatch().getVariety().getCrop() != null)
                    ? listing.getBatch().getVariety().getCrop().getName() : null;
            String varietyName = (listing.getBatch() != null && listing.getBatch().getVariety() != null)
                    ? listing.getBatch().getVariety().getName() : null;

            ChatMessage msg = new ChatMessage(
                    conversation,
                    buyer,
                    farmer,
                    sanitizeContent(req.initialMessage()),
                    "init_" + System.currentTimeMillis()
            );
            msg.setListingId(listing.getId());
            msg.setCropName(cropName);
            msg.setVarietyName(varietyName);

            chatMessageRepository.save(msg);
            conversation.setLastMessageAt(LocalDateTime.now());
            conversationRepository.save(conversation);

            // Persistent Notification & STOMP Broadcast
            String notifTitle = "New message from " + buyer.getFullName();
            if (cropName != null) {
                notifTitle = "New message from " + buyer.getFullName() + " about " + cropName + (varietyName != null ? " (" + varietyName + ")" : "");
            }
            notificationService.createNotification(
                    farmer,
                    notifTitle,
                    req.initialMessage().trim(),
                    "CHAT_MESSAGE",
                    "CONVERSATION",
                    conversation.getId()
            );
        }

        return mapToConversationResponse(conversation, buyer.getId());
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getUserConversations(String userPublicId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        List<Conversation> list = conversationRepository.findAllByUserId(user.getId());
        return list.stream()
                .map(c -> mapToConversationResponse(c, user.getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversationById(String userPublicId, Long conversationId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation not found"));

        if (!conversation.getFarmer().getId().equals(user.getId()) &&
            !conversation.getBuyer().getId().equals(user.getId()) &&
            !user.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNAUTHORIZED_CHAT_ACCESS", "You are not a participant in this conversation.");
        }

        return mapToConversationResponse(conversation, user.getId());
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getConversationMessages(String userPublicId, Long conversationId, int page, int size, Long beforeId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation not found"));

        if (!conversation.getFarmer().getId().equals(user.getId()) &&
            !conversation.getBuyer().getId().equals(user.getId()) &&
            !user.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNAUTHORIZED_CHAT_ACCESS", "You are not a participant in this conversation.");
        }

        List<ChatMessage> messages;
        if (beforeId != null && beforeId > 0) {
            // Older messages before the cursor
            List<ChatMessage> olderDesc = chatMessageRepository.findOlderMessagesByConversationId(conversationId, beforeId, PageRequest.of(0, size));
            messages = new ArrayList<>(olderDesc);
            Collections.reverse(messages); // Convert back to ASC chronological order
        } else {
            // Default: strictly ASCENDING chronological order (Oldest first at top, latest at bottom)
            messages = chatMessageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
        }

        return messages.stream()
                .map(this::mapToChatMessageResponse)
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendMessage(String userPublicId, SendMessageRequest req) {
        User sender = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        if (req.content() == null || req.content().trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_MESSAGE", "Message content cannot be empty.");
        }

        if (req.content().length() > 2000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MESSAGE_TOO_LONG", "Message length exceeds 2000 character limit.");
        }

        Conversation conversation = conversationRepository.findById(req.conversationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation not found"));

        if (!conversation.getFarmer().getId().equals(sender.getId()) &&
            !conversation.getBuyer().getId().equals(sender.getId()) &&
            !sender.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNAUTHORIZED_SENDER", "You are not a participant in this conversation.");
        }

        User recipient = conversation.getFarmer().getId().equals(sender.getId())
                ? conversation.getBuyer()
                : conversation.getFarmer();

        if (req.clientMessageId() != null && !req.clientMessageId().isBlank()) {
            Optional<ChatMessage> existing = chatMessageRepository.findBySenderIdAndClientMessageId(sender.getId(), req.clientMessageId());
            if (existing.isPresent()) {
                return mapToChatMessageResponse(existing.get());
            }
        }

        ChatMessage message = new ChatMessage(
                conversation,
                sender,
                recipient,
                sanitizeContent(req.content()),
                req.clientMessageId()
        );

        if (req.listingId() != null) {
            message.setListingId(req.listingId());
        } else if (conversation.getListing() != null) {
            message.setListingId(conversation.getListing().getId());
        }

        if (req.cropName() != null && !req.cropName().isBlank()) {
            message.setCropName(req.cropName());
        } else if (conversation.getListing() != null && conversation.getListing().getBatch() != null &&
                   conversation.getListing().getBatch().getVariety() != null &&
                   conversation.getListing().getBatch().getVariety().getCrop() != null) {
            message.setCropName(conversation.getListing().getBatch().getVariety().getCrop().getName());
        }

        if (req.varietyName() != null && !req.varietyName().isBlank()) {
            message.setVarietyName(req.varietyName());
        } else if (conversation.getListing() != null && conversation.getListing().getBatch() != null &&
                   conversation.getListing().getBatch().getVariety() != null) {
            message.setVarietyName(conversation.getListing().getBatch().getVariety().getName());
        }

        if (req.messageType() != null && !req.messageType().isBlank()) {
            message.setMessageType(req.messageType());
        }

        message = chatMessageRepository.save(message);

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // Persistent notification for recipient
        String notifTitle = "New message from " + sender.getFullName();
        if (message.getCropName() != null && !message.getCropName().isBlank()) {
            notifTitle = (sender.hasRole("FARMER") ? sender.getFullName() + " replied about " : "New message from " + sender.getFullName() + " about ")
                    + message.getCropName() + (message.getVarietyName() != null ? " (" + message.getVarietyName() + ")" : "");
        }
        notificationService.createNotification(
                recipient,
                notifTitle,
                message.getEncryptedContent(),
                "CHAT_MESSAGE",
                "CONVERSATION",
                conversation.getId()
        );

        return mapToChatMessageResponse(message);
    }

    @Transactional
    public void markMessagesAsRead(String userPublicId, Long conversationId) {
        User recipient = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        chatMessageRepository.markAllAsReadInConversation(conversationId, recipient.getId(), LocalDateTime.now());
    }

    @Transactional
    public void markMessagesAsDelivered(String userPublicId) {
        User recipient = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        chatMessageRepository.markAllSentAsDeliveredForUser(recipient.getId(), LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(String userPublicId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        long unread = chatMessageRepository.countTotalUnreadByUserId(user.getId());
        return new UnreadCountResponse(unread);
    }

    @Transactional
    public void deleteConversation(String userPublicId, Long conversationId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation not found"));

        boolean isFarmer = conv.getFarmer().getId().equals(user.getId());
        boolean isBuyer = conv.getBuyer().getId().equals(user.getId());

        if (!isFarmer && !isBuyer && !user.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNAUTHORIZED", "You are not a participant in this conversation.");
        }

        chatMessageRepository.deleteByConversationId(conversationId);
        conversationRepository.delete(conv);
    }

    @Transactional
    public void sendSystemMessage(User sender, User recipient, MarketplaceListing listing, String text) {
        if (sender == null || recipient == null || text == null || text.isBlank() || listing == null) return;

        User farmer = sender.hasRole("FARMER") ? sender : recipient;
        User buyer = sender.hasRole("BUYER") ? sender : recipient;

        Conversation conversation = conversationRepository.findActiveConversationBetween(farmer.getId(), buyer.getId())
                .orElseGet(() -> {
                    Conversation c = new Conversation(farmer, buyer, listing);
                    return conversationRepository.save(c);
                });

        ChatMessage msg = new ChatMessage(
                conversation,
                sender,
                recipient,
                sanitizeContent(text),
                "sys_" + System.currentTimeMillis()
        );
        msg.setMessageType("SYSTEM");
        if (listing.getBatch() != null && listing.getBatch().getVariety() != null) {
            msg.setListingId(listing.getId());
            if (listing.getBatch().getVariety().getCrop() != null) {
                msg.setCropName(listing.getBatch().getVariety().getCrop().getName());
            }
            msg.setVarietyName(listing.getBatch().getVariety().getName());
        }

        chatMessageRepository.save(msg);
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        ChatMessageResponse response = mapToChatMessageResponse(msg);
        WebSocketEventDto event = new WebSocketEventDto("NEW_MESSAGE", conversation.getId(), response);
        messagingTemplate.convertAndSend("/topic/conversations." + conversation.getId(), event);
        messagingTemplate.convertAndSendToUser(recipient.getPublicId(), "/queue/messages", event);
        messagingTemplate.convertAndSendToUser(sender.getPublicId(), "/queue/messages", event);
    }

    @Transactional
    public void sendStructuredPurchaseRequestMessage(User buyer, User farmer, MarketplaceListing listing, String text, Long purchaseRequestId) {
        if (buyer == null || farmer == null || text == null || text.isBlank() || listing == null) return;

        Conversation conversation = conversationRepository.findActiveConversationBetween(farmer.getId(), buyer.getId())
                .orElseGet(() -> {
                    Conversation c = new Conversation(farmer, buyer, listing);
                    return conversationRepository.save(c);
                });

        ChatMessage msg = new ChatMessage(
                conversation,
                buyer,
                farmer,
                sanitizeContent(text),
                "pr_" + purchaseRequestId + "_" + System.currentTimeMillis()
        );
        msg.setMessageType("PURCHASE_REQUEST");
        msg.setPurchaseRequestId(purchaseRequestId);
        msg.setListingId(listing.getId());
        if (listing.getBatch() != null && listing.getBatch().getVariety() != null) {
            if (listing.getBatch().getVariety().getCrop() != null) {
                msg.setCropName(listing.getBatch().getVariety().getCrop().getName());
            }
            msg.setVarietyName(listing.getBatch().getVariety().getName());
        }

        chatMessageRepository.save(msg);
        conversation.setLastMessageAt(LocalDateTime.now());
        conversation.setListing(listing);
        conversationRepository.save(conversation);

        ChatMessageResponse response = mapToChatMessageResponse(msg);
        WebSocketEventDto event = new WebSocketEventDto("NEW_MESSAGE", conversation.getId(), response);
        messagingTemplate.convertAndSend("/topic/conversations." + conversation.getId(), event);
        messagingTemplate.convertAndSendToUser(farmer.getPublicId(), "/queue/messages", event);
        messagingTemplate.convertAndSendToUser(buyer.getPublicId(), "/queue/messages", event);
    }

    private String sanitizeContent(String text) {
        if (text == null) return "";
        return text.replaceAll("<script.*?>.*?</script>", "")
                   .replaceAll("<[^>]*>", "")
                   .trim();
    }

    public ConversationResponse mapToConversationResponse(Conversation c, Long currentUserId) {
        long unread = chatMessageRepository.countUnreadByConversationAndUserId(c.getId(), currentUserId);
        List<ChatMessage> msgs = chatMessageRepository.findByConversationIdOrderBySentAtAsc(c.getId());
        ChatMessage lastMsg = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1);

        MarketplaceListing listing = c.getListing();
        String cropName = (lastMsg != null && lastMsg.getCropName() != null) ? lastMsg.getCropName()
                : (listing != null && listing.getBatch() != null && listing.getBatch().getVariety() != null && listing.getBatch().getVariety().getCrop() != null)
                ? listing.getBatch().getVariety().getCrop().getName() : null;

        String cropVariety = (lastMsg != null && lastMsg.getVarietyName() != null) ? lastMsg.getVarietyName()
                : (listing != null && listing.getBatch() != null && listing.getBatch().getVariety() != null)
                ? listing.getBatch().getVariety().getName() : null;

        Double askingPrice = listing != null && listing.getAskingPricePerUnit() != null ? listing.getAskingPricePerUnit().doubleValue() : null;
        Double quantityRemaining = listing != null && listing.getQuantityRemaining() != null ? listing.getQuantityRemaining().doubleValue() : null;

        return new ConversationResponse(
                c.getId(),
                c.getPublicId(),
                c.getFarmer().getId(),
                c.getFarmer().getFullName(),
                c.getBuyer().getId(),
                c.getBuyer().getFullName(),
                listing != null ? listing.getId() : null,
                cropName,
                cropVariety,
                "GRADE_A_PREMIUM",
                askingPrice,
                quantityRemaining,
                5.0,
                listing != null ? listing.getStatus() : null,
                lastMsg != null ? lastMsg.getEncryptedContent() : null,
                c.getLastMessageAt() != null ? c.getLastMessageAt().format(ISO_FORMATTER) : null,
                unread,
                c.getStatus(),
                c.getCreatedAt() != null ? c.getCreatedAt().format(ISO_FORMATTER) : ""
        );
    }

    public ChatMessageResponse mapToChatMessageResponse(ChatMessage m) {
        String role = m.getSender().hasRole("FARMER") ? "FARMER" : "BUYER";
        return new ChatMessageResponse(
                m.getId(),
                m.getPublicId(),
                m.getConversation().getId(),
                m.getConversation().getPublicId(),
                m.getSender().getId(),
                m.getSender().getFullName(),
                role,
                m.getRecipient().getId(),
                m.getRecipient().getFullName(),
                m.getMessageType(),
                m.getEncryptedContent(),
                m.getClientMessageId(),
                m.getSentAt().format(ISO_FORMATTER),
                m.getDeliveredAt() != null ? m.getDeliveredAt().format(ISO_FORMATTER) : null,
                m.getReadAt() != null ? m.getReadAt().format(ISO_FORMATTER) : null,
                m.getStatus(),
                m.getListingId(),
                m.getCropName(),
                m.getVarietyName(),
                m.getPurchaseRequestId()
        );
    }
}
