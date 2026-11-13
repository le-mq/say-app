package com.say.backend.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemStatsDto {
    private long totalUsers;
    private long totalNotes;
    private long totalFriendships;
    private long totalApiRequests;
    private long errorApiRequests;
    private Map<String, Long> requestsByEndpoint;
}
