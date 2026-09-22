package com.agrigrade.notification.service;

import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.chat.dto.WebSocketEventDto;
import com.agrigrade.common.exception.ApiException;
import com.agrigrade.notification.dto.NotificationResponse;
import com.agrigrade.notification.dto.UnreadNotificationCountResponse;
import com.agrigrade.notification.entity.Notification;
import com.agrigrade.notification.repository.NotificationRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            @Lazy SimpMessagingTemplate messagingTemplate
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public NotificationResponse createNotification(
            User user,
            String title,
            String body,
            String notificationType,
            String referenceType,
            Long referenceId
    ) {
        if (user == null) return null;

        Notification notif = new Notification(user, title, body, notificationType, referenceType, referenceId);
        notif = notificationRepository.save(notif);

        NotificationResponse response = mapToResponse(notif);

        // Real-Time STOMP Broadcast to recipient
        try {
            String eventId = UUID.randomUUID().toString();
            WebSocketEventDto event = new WebSocketEventDto(eventId, "NOTIFICATION_CREATED", referenceId != null ? referenceId : 0L, response);
            messagingTemplate.convertAndSendToUser(user.getPublicId(), "/queue/notifications", event);
            messagingTemplate.convertAndSendToUser(user.getPublicId(), "/queue/messages", event);
        } catch (Exception e) {
            // Log warning, notification is safely persisted in MySQL
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(String userPublicId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return list.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public UnreadNotificationCountResponse getUnreadCount(String userPublicId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        long unread = notificationRepository.countUnreadByUserId(user.getId());
        return new UnreadNotificationCountResponse(unread);
    }

    @Transactional
    public void markAsRead(String userPublicId, Long notificationId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        notificationRepository.markAsRead(notificationId, user.getId(), LocalDateTime.now());
    }

    @Transactional
    public void markAllAsRead(String userPublicId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        notificationRepository.markAllAsRead(user.getId(), LocalDateTime.now());
    }

    public NotificationResponse mapToResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getUser() != null ? n.getUser().getId() : null,
                n.getTitle(),
                n.getBody(),
                n.getNotificationType(),
                n.getReferenceType(),
                n.getReferenceId(),
                n.getReadAt() != null ? n.getReadAt().format(ISO_FORMATTER) : null,
                n.getCreatedAt() != null ? n.getCreatedAt().format(ISO_FORMATTER) : "",
                n.isRead()
        );
    }
}
