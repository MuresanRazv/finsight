package org.finsight.coreapi.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.finsight.coreapi.dto.SearchRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Slf4j
public class SearchController {

    private final RestTemplate restTemplate;

    @Value("${nlp.api.url}")
    private String nlpApiUrl;

    @PostMapping("/semantic")
    public ResponseEntity<String> semanticSearch(@RequestBody SearchRequest searchRequest) {
        String url = nlpApiUrl + "/search?query=" + searchRequest.getQuery() + "&type=semantic&limit=10";
        log.info("Calling NLP API: {}", url);
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }
}
