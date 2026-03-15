package org.finsight.coreapi.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.finsight.coreapi.dto.SearchQuery;
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
        
        String responseBody = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search")
                        .queryParam("query", query.getQuery())
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .block();
                
        return ResponseEntity.ok(responseBody);
    }
}
