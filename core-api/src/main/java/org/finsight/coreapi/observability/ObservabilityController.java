package org.finsight.coreapi.observability;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

@RestController
@RequestMapping("/api/observability")
@RequiredArgsConstructor
@Slf4j
public class ObservabilityController {

    private final WebClient.Builder webClientBuilder;

    @Value("${nlp.api.url}")
    private String nlpApiUrl;

    @GetMapping("/metrics")
    public ResponseEntity<?> getMetrics() {
        log.info("Fetching observability metrics from nlp-api: {}", nlpApiUrl);
        WebClient webClient = webClientBuilder.baseUrl(nlpApiUrl).build();
        try {
            String response = webClient.get()
                    .uri("/api/observability/metrics")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(response);
        } catch (Exception e) {
            log.error("Failed to fetch observability metrics from nlp-api: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("{\"success\": false, \"message\": \"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/metrics/clear")
    public ResponseEntity<?> clearMetrics(@RequestParam(required = false) String action) {
        log.info("Request to clear metrics for action: {} on nlp-api: {}", action, nlpApiUrl);
        WebClient webClient = webClientBuilder.baseUrl(nlpApiUrl).build();
        try {
            String response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/observability/metrics/clear")
                            .queryParam("action", action)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(response);
        } catch (Exception e) {
            log.error("Failed to clear observability metrics from nlp-api: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("{\"success\": false, \"message\": \"" + e.getMessage() + "\"}");
        }
    }
}
