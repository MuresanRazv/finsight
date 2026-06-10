package org.finsight.coreapi.search;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.finsight.coreapi.article.Article;
import org.finsight.coreapi.article.ArticleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Slf4j
public class SearchController {

    private final WebClient.Builder webClientBuilder;
    private final ArticleRepository articleRepository;
    private final ObjectMapper objectMapper;

    @Value("${nlp.api.url}")
    private String nlpApiUrl;

    @GetMapping("/semantic")
    public ResponseEntity<?> semanticSearch(@ModelAttribute SearchQuery query) {
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
            
            List<Map<String, Object>> results = objectMapper.readValue(responseBody, new TypeReference<List<Map<String, Object>>>() {});
            for (Map<String, Object> item : results) {
                try {
                    String itemUrl = (String) item.get("url");
                    String publishedAtStr = (String) item.get("published_at");
                    if (itemUrl != null && publishedAtStr != null) {
                        OffsetDateTime processedAt = OffsetDateTime.parse(publishedAtStr);
                        Optional<Article> articleOpt = articleRepository.findByUrlAndProcessedAt(itemUrl, processedAt);
                        if (articleOpt.isPresent()) {
                            item.put("uuid", articleOpt.get().getUuid().toString());
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Failed to lookup UUID for search item: {}", ex.getMessage());
                }
            }
                    
            return ResponseEntity.ok(results);
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
