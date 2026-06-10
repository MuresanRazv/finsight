package org.finsight.coreapi.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP rate limiting filter using the token bucket algorithm (Bucket4j).
 *
 * <p>Each unique client IP gets its own bucket with a capacity of
 * {@value #CAPACITY} requests, refilling at a rate of {@value #CAPACITY}
 * requests per {@value #REFILL_MINUTES} minute(s).
 *
 * <p>When a bucket is exhausted the filter short-circuits with
 * {@code 429 Too Many Requests} and a {@code Retry-After} header indicating
 * how many seconds the client should wait before retrying.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final long CAPACITY        = 100;
    private static final long REFILL_MINUTES  = 1;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest  request,
            HttpServletResponse response,
            FilterChain         filterChain
    ) throws ServletException, IOException {

        String ip     = resolveClientIp(request);
        Bucket bucket = buckets.computeIfAbsent(ip, this::newBucket);

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            long waitSeconds = bucket.getAvailableTokens() == 0
                    ? Duration.ofMinutes(REFILL_MINUTES).getSeconds()
                    : 1L;

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(waitSeconds));
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Too many requests. Please slow down and retry after "
                    + waitSeconds + " second(s).\"}"
            );
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Respects the {@code X-Forwarded-For} header so the filter works correctly
     * when the API is deployed behind a reverse proxy (nginx, AWS ALB, etc.).
     */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // X-Forwarded-For can be a comma-separated list; the first value is the original client
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private Bucket newBucket(String ip) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(CAPACITY)
                .refillGreedy(CAPACITY, Duration.ofMinutes(REFILL_MINUTES))
                .build();
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
