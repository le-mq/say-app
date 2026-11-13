package com.say.backend.modules.notification.service;

import com.say.backend.modules.notification.dto.NotificationDto;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public interface INotificationService {

    SseEmitter subscribe(UUID userId);

    CompletableFuture<NotificationDto> sendNotification(UUID recipientId, UUID senderId, String type, String message, UUID referenceId);

    CompletableFuture<List<NotificationDto>> getNotifications(UUID recipientId, int limit);

    CompletableFuture<Long> getUnreadCount(UUID recipientId);

    CompletableFuture<Void> markAsRead(UUID notificationId, UUID recipientId);

    CompletableFuture<Void> markAllAsRead(UUID recipientId);
}
