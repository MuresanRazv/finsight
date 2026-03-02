package org.finsight.coreapi.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.finsight.coreapi.dto.SearchQuery;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Slf4j
public class SearchController {

    private final RestTemplate restTemplate;

    @Value("${nlp.api.url}")
    private String nlpApiUrl;

    @GetMapping("/semantic")
    public ResponseEntity<String> semanticSearch(@ModelAttribute SearchQuery query) {
        String url = nlpApiUrl + "/search?query=" + query.getQuery();
        log.info("Calling NLP API: {}", url);
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }
}
