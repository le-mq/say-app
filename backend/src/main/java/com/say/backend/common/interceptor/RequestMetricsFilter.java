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
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Component
public class RequestMetricsFilter extends OncePerRequestFilter {

    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong errorRequests = new AtomicLong(0);
    private final AtomicBoolean maintenanceMode = new AtomicBoolean(false);
    private final Map<String, AtomicLong> endpointCounters = new ConcurrentHashMap<>();

    public void setMaintenanceMode(boolean active) {
        this.maintenanceMode.set(active);
        log.info("System maintenance mode set to: {}", active);
    }

    public boolean isMaintenanceMode() {
        return this.maintenanceMode.get();
    }

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

        // Enforce Maintenance Mode: allow admin and auth endpoints to continue operating
        if (maintenanceMode.get()) {
            boolean isExempt = uri.contains("/api/v1/admin") || uri.contains("/api/v1/auth");
            if (!isExempt) {
                response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"status\":503,\"message\":\"Hệ thống đang bảo trì theo kế hoạch. Vui lòng quay lại sau ít phút.\",\"data\":null}");
                return;
            }
        }

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
