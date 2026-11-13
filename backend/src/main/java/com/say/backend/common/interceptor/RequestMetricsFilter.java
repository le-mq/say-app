package com.say.backend.common.interceptor;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Component
public class RequestMetricsFilter extends OncePerRequestFilter {

    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong errorRequests = new AtomicLong(0);
    private final Map<String, AtomicLong> endpointCounters = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String uri = request.getRequestURI();
        
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        totalRequests.incrementAndGet();

        String cleanEndpoint = normalizeEndpoint(uri);
        endpointCounters.computeIfAbsent(cleanEndpoint, k -> new AtomicLong(0)).incrementAndGet();

        try {
            filterChain.doFilter(request, response);
            if (response.getStatus() >= 400) {
                errorRequests.incrementAndGet();
            }
        } catch (Exception e) {
            errorRequests.incrementAndGet();
            throw e;
        }
    }

    private String normalizeEndpoint(String uri) {
        if (uri.startsWith("/api/v1/")) {
            uri = uri.substring(7);
        }
        return uri.replaceAll("/[0-9a-fA-F\\-]{36}", "/*");
    }

    public long getTotalRequests() {
        return totalRequests.get();
    }

    public long getErrorRequests() {
        return errorRequests.get();
    }

    public Map<String, Long> getEndpointStats() {
        Map<String, Long> stats = new ConcurrentHashMap<>();
        endpointCounters.forEach((k, v) -> stats.put(k, v.get()));
        return stats;
    }
}
