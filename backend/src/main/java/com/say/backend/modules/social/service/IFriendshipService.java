package com.say.backend.modules.social.service;

import com.say.backend.modules.social.dto.FriendProfileDto;
import com.say.backend.modules.social.dto.FriendResponse;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public interface IFriendshipService {

    CompletableFuture<FriendResponse> sendFriendRequest(UUID requesterId, UUID addresseeId);

    CompletableFuture<FriendResponse> acceptFriendRequest(UUID friendshipId, UUID currentUserId);

    CompletableFuture<FriendResponse> rejectFriendRequest(UUID friendshipId, UUID currentUserId);

    CompletableFuture<List<FriendProfileDto>> getFriendsList(UUID userId);

    CompletableFuture<List<FriendResponse>> getPendingRequests(UUID userId);
}
