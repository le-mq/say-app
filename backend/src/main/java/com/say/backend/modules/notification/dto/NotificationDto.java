package com.say.backend.modules.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private UUID id;
    private UUID recipientId;
    private UUID senderId;
    private String senderDisplayName;
    private String senderUsername;
    private String senderAvatarUrl;
    private String type;
    private String message;
    private UUID referenceId;
    private boolean read;
    private Instant createdAt;
}
