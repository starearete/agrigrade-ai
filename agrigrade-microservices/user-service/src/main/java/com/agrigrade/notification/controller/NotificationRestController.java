package com.agrigrade.notification.controller;

import com.agrigrade.common.dto.ApiResponse;
import com.agrigrade.notification.dto.NotificationResponse;
import com.agrigrade.notification.dto.UnreadNotificationCountResponse;
import com.agrigrade.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationRestController {

    private final NotificationService notificationService;

    public NotificationRestController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(Authentication authentication) {
        List<NotificationResponse> list = notificationService.getUserNotifications(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(list, "Notifications retrieved"));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadNotificationCountResponse>> getUnreadCount(Authentication authentication) {
        UnreadNotificationCountResponse count = notificationService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(count, "Unread count retrieved"));
    }

    @RequestMapping(value = "/{id}/read", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            Authentication authentication,
            @PathVariable Long id
    ) {
        notificationService.markAsRead(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
    }

    @RequestMapping(value = "/read-all", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }
}
