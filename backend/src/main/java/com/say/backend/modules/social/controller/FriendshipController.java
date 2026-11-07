package com.say.backend.modules.social.controller;

import com.say.backend.common.dto.ApiResponse;
import com.say.backend.modules.social.dto.FriendProfileDto;
import com.say.backend.modules.social.dto.FriendRequestDto;
import com.say.backend.modules.social.dto.FriendResponse;
import com.say.backend.modules.social.service.IFriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/social")
@RequiredArgsConstructor
public class FriendshipController {

    private final IFriendshipService friendshipService;

    @PostMapping("/request")
    public CompletableFuture<ResponseEntity<ApiResponse<FriendResponse>>> sendFriendRequest(
            @RequestBody FriendRequestDto request
    ) {
        return friendshipService.sendFriendRequest(request.getRequesterId(), request.getAddresseeId())
                .thenApply(response -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Friend request sent successfully", response)));
    }

    @PutMapping("/request/{friendshipId}/accept")
    public CompletableFuture<ResponseEntity<ApiResponse<FriendResponse>>> acceptFriendRequest(
            @PathVariable UUID friendshipId,
            @RequestParam UUID currentUserId
    ) {
        return friendshipService.acceptFriendRequest(friendshipId, currentUserId)
                .thenApply(response -> ResponseEntity.ok(ApiResponse.success("Friend request accepted", response)));
    }

    @PutMapping("/request/{friendshipId}/reject")
    public CompletableFuture<ResponseEntity<ApiResponse<FriendResponse>>> rejectFriendRequest(
            @PathVariable UUID friendshipId,
            @RequestParam UUID currentUserId
    ) {
        return friendshipService.rejectFriendRequest(friendshipId, currentUserId)
                .thenApply(response -> ResponseEntity.ok(ApiResponse.success("Friend request rejected", response)));
    }

    @GetMapping("/friends/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<List<FriendProfileDto>>>> getFriendsList(
            @PathVariable UUID userId
    ) {
        return friendshipService.getFriendsList(userId)
                .thenApply(friends -> ResponseEntity.ok(ApiResponse.success("Friends list retrieved successfully", friends)));
    }

    @GetMapping("/requests/pending/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<List<FriendResponse>>>> getPendingRequests(
            @PathVariable UUID userId
    ) {
        return friendshipService.getPendingRequests(userId)
                .thenApply(requests -> ResponseEntity.ok(ApiResponse.success("Pending requests retrieved successfully", requests)));
    }

    @DeleteMapping("/friends/{friendshipId}")
    public CompletableFuture<ResponseEntity<ApiResponse<Void>>> removeFriend(
            @PathVariable UUID friendshipId,
            @RequestParam UUID currentUserId
    ) {
        return friendshipService.removeFriend(friendshipId, currentUserId)
                .thenApply(res -> ResponseEntity.ok(ApiResponse.success("Friend removed successfully", null)));
    }
}
