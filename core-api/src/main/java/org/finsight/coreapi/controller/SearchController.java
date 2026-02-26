package org.finsight.coreapi.controller;

import lombok.RequiredArgsConstructor;
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
public class SearchController {

    private final RestTemplate restTemplate;

    @Value("${nlp.api.url}")
    private String nlpApiUrl;

    @PostMapping("/semantic")
    public ResponseEntity<String> semanticSearch(@RequestBody String query) {
        String url = nlpApiUrl + "/search";
        ResponseEntity<String> response = restTemplate.postForEntity(url, query, String.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }
}