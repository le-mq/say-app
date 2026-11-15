package com.say.backend.modules.notification.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.ResourceNotFoundException;
import com.say.backend.modules.auth.entity.User;
import com.say.backend.modules.auth.repository.IUserRepository;
import com.say.backend.modules.notification.dto.NotificationDto;
import com.say.backend.modules.notification.entity.Notification;
import com.say.backend.modules.notification.repository.INotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService implements INotificationService {

    private final INotificationRepository notificationRepository;
    private final IUserRepository userRepository;

    private final Map<UUID, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    @Override
    public SseEmitter subscribe(UUID userId) {
        SseEmitter emitter = new SseEmitter(1800000L);

        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError((e) -> removeEmitter(userId, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("Connected to SAY real-time notifications stream"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    private void removeEmitter(UUID userId, SseEmitter emitter) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<NotificationDto> sendNotification(
            UUID recipientId,
            UUID senderId,
            String type,
            String message,
            UUID referenceId
    ) {
        try {
            User recipient = userRepository.findById(recipientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient not found: " + recipientId));

            User sender = senderId != null ? userRepository.findById(senderId).orElse(null) : null;

            Notification notification = Notification.builder()
                    .recipient(recipient)
                    .sender(sender)
                    .type(type)
                    .message(message)
                    .referenceId(referenceId)
                    .read(false)
                    .build();

            Notification saved = notificationRepository.save(notification);
            NotificationDto dto = mapToDto(saved);

            dispatchSseEvent(recipientId, dto);

            return CompletableFuture.completedFuture(dto);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating notification for user {}: {}", recipientId, e.getMessage());
            throw new AppException("Failed to send notification: " + e.getMessage());
        }
    }

    private void dispatchSseEvent(UUID recipientId, NotificationDto dto) {
        List<SseEmitter> emitters = userEmitters.get(recipientId);
        if (emitters != null && !emitters.isEmpty()) {
            List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("NOTIFICATION")
                            .data(dto));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            }
            emitters.removeAll(deadEmitters);
        }
    }

    @Override
    public void dispatchSilentEvent(UUID recipientId, String eventType, Object payload) {
        List<SseEmitter> emitters = userEmitters.get(recipientId);
        if (emitters != null && !emitters.isEmpty()) {
            List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name(eventType)
                            .data(payload != null ? payload : "{}"));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            }
            emitters.removeAll(deadEmitters);
        }
    }

    @Override
    public void broadcastSilentEvent(String eventType, Object payload) {
        for (Map.Entry<UUID, List<SseEmitter>> entry : userEmitters.entrySet()) {
            List<SseEmitter> emitters = entry.getValue();
            if (emitters != null && !emitters.isEmpty()) {
                List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
                for (SseEmitter emitter : emitters) {
                    try {
                        emitter.send(SseEmitter.event()
                                .name(eventType)
                                .data(payload != null ? payload : "{}"));
                    } catch (Exception e) {
                        deadEmitters.add(emitter);
                    }
                }
                emitters.removeAll(deadEmitters);
            }
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<List<NotificationDto>> getNotifications(UUID recipientId, int limit) {
        try {
            int pageLimit = Math.max(1, Math.min(limit, 50));
            List<Notification> list = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                    recipientId,
                    PageRequest.of(0, pageLimit)
            );
            List<NotificationDto> dtos = list.stream().map(this::mapToDto).toList();
            return CompletableFuture.completedFuture(dtos);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching notifications for user {}: {}", recipientId, e.getMessage());
            throw new AppException("Failed to load notifications: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<Long> getUnreadCount(UUID recipientId) {
        try {
            long count = notificationRepository.countByRecipientIdAndReadFalse(recipientId);
            return CompletableFuture.completedFuture(count);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching unread count for user {}: {}", recipientId, e.getMessage());
            throw new AppException("Failed to count unread notifications: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<Void> markAsRead(UUID notificationId, UUID recipientId) {
        try {
            Notification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

            if (!notification.getRecipient().getId().equals(recipientId)) {
                throw new AppException("Unauthorized to update this notification");
            }

            notification.setRead(true);
            notificationRepository.save(notification);
            return CompletableFuture.completedFuture(null);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error marking notification {} as read: {}", notificationId, e.getMessage());
            throw new AppException("Failed to mark notification as read: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<Void> markAsUnread(UUID notificationId, UUID recipientId) {
        try {
            Notification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

            if (!notification.getRecipient().getId().equals(recipientId)) {
                throw new AppException("Unauthorized to update this notification");
            }

            notification.setRead(false);
            notificationRepository.save(notification);
            return CompletableFuture.completedFuture(null);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error marking notification {} as unread: {}", notificationId, e.getMessage());
            throw new AppException("Failed to mark notification as unread: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<Void> deleteNotification(UUID notificationId, UUID recipientId) {
        try {
            Notification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

            if (!notification.getRecipient().getId().equals(recipientId)) {
                throw new AppException("Unauthorized to delete this notification");
            }

            notificationRepository.delete(notification);
            return CompletableFuture.completedFuture(null);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting notification {}: {}", notificationId, e.getMessage());
            throw new AppException("Failed to delete notification: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<Void> markAllAsRead(UUID recipientId) {
        try {
            notificationRepository.markAllAsRead(recipientId);
            return CompletableFuture.completedFuture(null);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error marking all notifications as read for {}: {}", recipientId, e.getMessage());
            throw new AppException("Failed to mark all as read: " + e.getMessage());
        }
    }

    @Override
    public int getActiveConnectionsCount() {
        return userEmitters.values().stream().mapToInt(List::size).sum();
    }

    @Override
    public int getActiveUsersCount() {
        return (int) userEmitters.values().stream().filter(l -> !l.isEmpty()).count();
    }

    private NotificationDto mapToDto(Notification n) {
        User sender = n.getSender();
        return NotificationDto.builder()
                .id(n.getId())
                .recipientId(n.getRecipient().getId())
                .senderId(sender != null ? sender.getId() : null)
                .senderDisplayName(sender != null ? sender.getDisplayName() : null)
                .senderUsername(sender != null ? sender.getUsername() : null)
                .senderAvatarUrl(sender != null ? sender.getAvatarUrl() : null)
                .type(n.getType())
                .message(n.getMessage())
                .referenceId(n.getReferenceId())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
