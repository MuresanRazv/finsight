package org.finsight.coreapi.search;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.finsight.coreapi.search.SearchQuery;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Slf4j
public class SearchController {

    private final WebClient.Builder webClientBuilder;

    @Value("${nlp.api.url}")
    private String nlpApiUrl;

    @GetMapping("/semantic")
    public ResponseEntity<String> semanticSearch(@ModelAttribute SearchQuery query) {
        String url = nlpApiUrl + "/search?query=" + query.getQuery();
        log.info("Calling NLP API: {}", url);
        
        WebClient webClient = webClientBuilder.baseUrl(nlpApiUrl).build();
        
        try {
            String responseBody = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/search")
                            .queryParam("query", query.getQuery())
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
                    
            return ResponseEntity.ok(responseBody);
        } catch (Exception e) {
            log.error("Failed to execute semantic search: {}", e.getMessage(), e);
            if (isConnectionError(e)) {
                return ResponseEntity.status(503).body("{\"success\": false, \"message\": \"The NLP engine is starting up and loading AI models (e.g. LLM, FinBERT). Please try again in 1-2 minutes.\"}");
            }
            return ResponseEntity.internalServerError().body("{\"success\": false, \"message\": \"" + e.getMessage() + "\"}");
        }
    }

    private boolean isConnectionError(Throwable e) {
        if (e == null) return false;
        String msg = e.getMessage();
        if (msg != null && (msg.contains("Connection refused") || msg.contains("finishConnect") || msg.contains("connection refused") || msg.contains("ConnectException"))) {
            return true;
        }
        return isConnectionError(e.getCause());
    }
}
