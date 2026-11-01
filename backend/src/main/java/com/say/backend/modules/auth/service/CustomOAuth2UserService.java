package com.say.backend.modules.auth.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.modules.auth.entity.User;
import com.say.backend.modules.auth.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements ICustomOAuth2UserService {

    private final IUserRepository userRepository;

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<User> processOAuth2User(String email, String name, String avatarUrl) {
        try {
            User user = userRepository.findByEmail(email)
                    .map(existingUser -> {
                        existingUser.setDisplayName(name != null ? name : existingUser.getDisplayName());
                        existingUser.setAvatarUrl(avatarUrl != null ? avatarUrl : existingUser.getAvatarUrl());
                        return userRepository.save(existingUser);
                    })
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .email(email)
                                .displayName(name != null ? name : "Audiophile")
                                .avatarUrl(avatarUrl)
                                .audiophileRank("Novice Listener")
                                .build();
                        return userRepository.save(newUser);
                    });

            return CompletableFuture.completedFuture(user);
        } catch (Exception e) {
            log.error("Error processing OAuth2 user {}: {}", email, e.getMessage());
            throw new AppException("Failed to process OAuth2 user: " + e.getMessage());
        }
    }
}
