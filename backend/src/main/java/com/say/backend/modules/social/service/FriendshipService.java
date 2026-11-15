package com.say.backend.modules.social.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.BadRequestException;
import com.say.backend.common.exception.ResourceNotFoundException;
import com.say.backend.modules.auth.entity.User;
import com.say.backend.modules.auth.repository.IUserRepository;
import com.say.backend.modules.notification.service.INotificationService;
import com.say.backend.modules.social.dto.FriendProfileDto;
import com.say.backend.modules.social.dto.FriendResponse;
import com.say.backend.modules.social.entity.Friendship;
import com.say.backend.modules.social.repository.IFriendshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class FriendshipService implements IFriendshipService {

    private final IFriendshipRepository friendshipRepository;
    private final IUserRepository userRepository;
    private final INotificationService notificationService;

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<FriendResponse> sendFriendRequest(UUID requesterId, UUID addresseeId) {
        try {
            if (requesterId.equals(addresseeId)) {
                throw new BadRequestException("You cannot send a friend request to yourself");
            }

            User requester = userRepository.findById(requesterId)
                    .orElseThrow(() -> new ResourceNotFoundException("Requester not found with id: " + requesterId));

            User addressee = userRepository.findById(addresseeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Addressee not found with id: " + addresseeId));

            Optional<Friendship> existing = friendshipRepository.findFriendshipBetween(requesterId, addresseeId);
            Friendship saved;
            if (existing.isPresent()) {
                Friendship f = existing.get();
                if ("ACCEPTED".equals(f.getStatus())) {
                    throw new BadRequestException("You are already friends with this user");
                }
                if ("PENDING".equals(f.getStatus())) {
                    throw new BadRequestException("A friend request is already pending between both users");
                }
                f.setRequester(requester);
                f.setAddressee(addressee);
                f.setStatus("PENDING");
                saved = friendshipRepository.save(f);
            } else {
                Friendship friendship = Friendship.builder()
                        .requester(requester)
                        .addressee(addressee)
                        .status("PENDING")
                        .build();
                saved = friendshipRepository.save(friendship);
            }
            
            // Notify addressee that someone sent a friendship invitation
            try {
                notificationService.sendNotification(
                        addresseeId,
                        requesterId,
                        "FRIEND_REQUEST",
                        requester.getDisplayName() + " sent you a friendship invitation.",
                        saved.getId()
                );
            } catch (Exception ex) {
                log.warn("Could not dispatch friend request notification: {}", ex.getMessage());
            }

            return CompletableFuture.completedFuture(mapToResponseDto(saved));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error sending friend request from {} to {}: {}", requesterId, addresseeId, e.getMessage());
            throw new AppException("Failed to send friend request: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<FriendResponse> acceptFriendRequest(UUID friendshipId, UUID currentUserId) {
        try {
            Friendship friendship = friendshipRepository.findById(friendshipId)
                    .orElseThrow(() -> new ResourceNotFoundException("Friend request not found with id: " + friendshipId));

            if (!friendship.getAddressee().getId().equals(currentUserId)) {
                throw new BadRequestException("Unauthorized to accept this friend request");
            }

            friendship.setStatus("ACCEPTED");
            Friendship saved = friendshipRepository.save(friendship);
            
            // Notify requester that invitation was accepted
            try {
                notificationService.sendNotification(
                        friendship.getRequester().getId(),
                        currentUserId,
                        "FRIEND_ACCEPTED",
                        friendship.getAddressee().getDisplayName() + " accepted your friendship invitation.",
                        saved.getId()
                );
            } catch (Exception ex) {
                log.warn("Could not dispatch friend accepted notification: {}", ex.getMessage());
            }

            return CompletableFuture.completedFuture(mapToResponseDto(saved));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error accepting friend request {}: {}", friendshipId, e.getMessage());
            throw new AppException("Failed to accept friend request: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<FriendResponse> rejectFriendRequest(UUID friendshipId, UUID currentUserId) {
        try {
            Friendship friendship = friendshipRepository.findById(friendshipId)
                    .orElseThrow(() -> new ResourceNotFoundException("Friend request not found with id: " + friendshipId));

            if (!friendship.getAddressee().getId().equals(currentUserId)) {
                throw new BadRequestException("Unauthorized to reject this friend request");
            }

            friendship.setStatus("REJECTED");
            Friendship saved = friendshipRepository.save(friendship);

            // Silently dispatch real-time UI update event without sending an impolite toast/notification to requester
            try {
                notificationService.dispatchSilentEvent(
                        friendship.getRequester().getId(),
                        "FRIEND_SYNC",
                        Map.of("type", "FRIEND_REJECTED", "friendshipId", saved.getId().toString())
                );
            } catch (Exception ex) {
                log.warn("Could not dispatch silent friend rejected event: {}", ex.getMessage());
            }

            return CompletableFuture.completedFuture(mapToResponseDto(saved));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error rejecting friend request {}: {}", friendshipId, e.getMessage());
            throw new AppException("Failed to reject friend request: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<List<FriendProfileDto>> getFriendsList(UUID userId) {
        try {
            if (!userRepository.existsById(userId)) {
                throw new ResourceNotFoundException("User not found with id: " + userId);
            }

            List<Friendship> friendships = friendshipRepository.findAllAcceptedFriendships(userId);
            List<FriendProfileDto> friends = friendships.stream()
                    .map(f -> {
                        User friend = f.getRequester().getId().equals(userId) ? f.getAddressee() : f.getRequester();
                        return FriendProfileDto.builder()
                                .friendshipId(f.getId())
                                .friendId(friend.getId())
                                .username(friend.getUsername())
                                .displayName(friend.getDisplayName())
                                .avatarUrl(friend.getAvatarUrl())
                                .audiophileRank(friend.getAudiophileRank())
                                .bio(friend.getBio())
                                .build();
                    })
                    .toList();

            return CompletableFuture.completedFuture(friends);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving friend list for user {}: {}", userId, e.getMessage());
            throw new AppException("Failed to retrieve friend list: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<List<FriendResponse>> getPendingRequests(UUID userId) {
        try {
            if (!userRepository.existsById(userId)) {
                throw new ResourceNotFoundException("User not found with id: " + userId);
            }

            List<Friendship> requests = friendshipRepository.findAllPendingRequestsForUser(userId);
            List<FriendResponse> dtos = requests.stream().map(this::mapToResponseDto).toList();
            return CompletableFuture.completedFuture(dtos);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving pending friend requests for user {}: {}", userId, e.getMessage());
            throw new AppException("Failed to retrieve pending friend requests: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<Void> removeFriend(UUID friendshipId, UUID currentUserId) {
        try {
            Friendship friendship = friendshipRepository.findById(friendshipId)
                    .orElseThrow(() -> new ResourceNotFoundException("Friendship not found with id: " + friendshipId));

            boolean isParticipant = friendship.getRequester().getId().equals(currentUserId)
                    || friendship.getAddressee().getId().equals(currentUserId);

            if (!isParticipant) {
                throw new BadRequestException("Unauthorized to remove this friendship");
            }

            UUID otherUserId = friendship.getRequester().getId().equals(currentUserId)
                    ? friendship.getAddressee().getId()
                    : friendship.getRequester().getId();

            friendshipRepository.delete(friendship);
            log.info("Friendship {} successfully removed by user {}", friendshipId, currentUserId);

            // Notify the other user of connection update
            try {
                notificationService.sendNotification(
                        otherUserId,
                        currentUserId,
                        "FRIEND_REMOVED",
                        "Friendship connection was updated.",
                        friendshipId
                );
            } catch (Exception ex) {
                log.warn("Could not dispatch friend removed notification: {}", ex.getMessage());
            }

            return CompletableFuture.completedFuture(null);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error removing friendship {}: {}", friendshipId, e.getMessage());
            throw new AppException("Failed to remove friend: " + e.getMessage());
        }
    }

    private FriendResponse mapToResponseDto(Friendship friendship) {
        return FriendResponse.builder()
                .id(friendship.getId())
                .requesterId(friendship.getRequester().getId())
                .requesterUsername(friendship.getRequester().getUsername())
                .requesterDisplayName(friendship.getRequester().getDisplayName())
                .requesterAvatarUrl(friendship.getRequester().getAvatarUrl())
                .requesterAudiophileRank(friendship.getRequester().getAudiophileRank())
                .addresseeId(friendship.getAddressee().getId())
                .addresseeUsername(friendship.getAddressee().getUsername())
                .addresseeDisplayName(friendship.getAddressee().getDisplayName())
                .addresseeAvatarUrl(friendship.getAddressee().getAvatarUrl())
                .addresseeAudiophileRank(friendship.getAddressee().getAudiophileRank())
                .status(friendship.getStatus())
                .createdAt(friendship.getCreatedAt())
                .updatedAt(friendship.getUpdatedAt())
                .build();
    }
}
