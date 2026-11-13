package com.say.backend.modules.notification.controller;

import com.say.backend.common.dto.ApiResponse;
import com.say.backend.modules.notification.dto.NotificationDto;
import com.say.backend.modules.notification.service.INotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final INotificationService notificationService;

    @GetMapping(value = "/stream/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@PathVariable UUID userId) {
        return notificationService.subscribe(userId);
    }

    @GetMapping("/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<List<NotificationDto>>>> getNotifications(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return notificationService.getNotifications(userId, limit)
                .thenApply(list -> ResponseEntity.ok(ApiResponse.success("Notifications fetched", list)));
    }

    @GetMapping("/unread-count/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<Long>>> getUnreadCount(
            @PathVariable UUID userId
    ) {
        return notificationService.getUnreadCount(userId)
                .thenApply(count -> ResponseEntity.ok(ApiResponse.success(count)));
    }

    @PutMapping("/{notificationId}/read")
    public CompletableFuture<ResponseEntity<ApiResponse<Void>>> markAsRead(
            @PathVariable UUID notificationId,
            @RequestParam UUID userId
    ) {
        return notificationService.markAsRead(notificationId, userId)
                .thenApply(res -> ResponseEntity.ok(ApiResponse.success("Marked as read", null)));
    }

    @PutMapping("/read-all/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<Void>>> markAllAsRead(
            @PathVariable UUID userId
    ) {
        return notificationService.markAllAsRead(userId)
                .thenApply(res -> ResponseEntity.ok(ApiResponse.success("All marked as read", null)));
    }
}
