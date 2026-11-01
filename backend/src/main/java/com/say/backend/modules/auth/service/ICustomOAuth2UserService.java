package com.say.backend.modules.auth.service;

import com.say.backend.modules.auth.entity.User;

import java.util.concurrent.CompletableFuture;

public interface ICustomOAuth2UserService {

    CompletableFuture<User> processOAuth2User(String email, String name, String avatarUrl);
}
