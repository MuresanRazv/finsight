package org.finsight.coreapi.rss;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@RestController
@RequestMapping("/api/rss-sources")
@RequiredArgsConstructor
@Slf4j
public class RssSourceController {

    private final RssSourceRepository rssSourceRepository;
    private final WebClient.Builder webClientBuilder;

    @Value("${nlp.api.url}")
    private String nlpApiUrl;

    @GetMapping("/active")
    public ResponseEntity<List<RssSource>> getActiveSources() {
        return ResponseEntity.ok(rssSourceRepository.findByIsEnabledTrue());
    }

    @GetMapping
    public ResponseEntity<List<RssSource>> getAllSources() {
        return ResponseEntity.ok(rssSourceRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<RssSource> createSource(@RequestBody RssSourceDto dto) {
        RssSource source = RssSource.builder()
                .name(dto.getName())
                .url(dto.getUrl())
                .isEnabled(dto.getIsEnabled() != null ? dto.getIsEnabled() : true)
                .itemSelector(dto.getItemSelector() != null ? dto.getItemSelector() : "item")
                .titleSelector(dto.getTitleSelector() != null ? dto.getTitleSelector() : "title")
                .linkSelector(dto.getLinkSelector() != null ? dto.getLinkSelector() : "link")
                .linkAttribute(dto.getLinkAttribute())
                .descriptionSelector(dto.getDescriptionSelector() != null ? dto.getDescriptionSelector() : "description")
                .pubDateSelector(dto.getPubDateSelector() != null ? dto.getPubDateSelector() : "pubDate")
                .pubDateFormat(dto.getPubDateFormat())
                .build();
        return ResponseEntity.ok(rssSourceRepository.save(source));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RssSource> updateSource(@PathVariable Integer id, @RequestBody RssSourceDto dto) {
        RssSource source = rssSourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RSS Source not found"));
        
        if (Boolean.TRUE.equals(source.getIsDefault())) {
            if (dto.getIsEnabled() != null) {
                source.setIsEnabled(dto.getIsEnabled());
            }
            if (dto.getName() != null || dto.getUrl() != null || dto.getItemSelector() != null ||
                dto.getTitleSelector() != null || dto.getLinkSelector() != null || dto.getLinkAttribute() != null ||
                dto.getDescriptionSelector() != null || dto.getPubDateSelector() != null || dto.getPubDateFormat() != null) {
                throw new RuntimeException("Default configurations cannot be edited (only active status can be toggled)");
            }
            return ResponseEntity.ok(rssSourceRepository.save(source));
        }

        if (dto.getName() != null) source.setName(dto.getName());
        if (dto.getUrl() != null) source.setUrl(dto.getUrl());
        if (dto.getIsEnabled() != null) source.setIsEnabled(dto.getIsEnabled());
        if (dto.getItemSelector() != null) source.setItemSelector(dto.getItemSelector());
        if (dto.getTitleSelector() != null) source.setTitleSelector(dto.getTitleSelector());
        if (dto.getLinkSelector() != null) source.setLinkSelector(dto.getLinkSelector());
        source.setLinkAttribute(dto.getLinkAttribute()); // Allow clearing it
        if (dto.getDescriptionSelector() != null) source.setDescriptionSelector(dto.getDescriptionSelector());
        if (dto.getPubDateSelector() != null) source.setPubDateSelector(dto.getPubDateSelector());
        source.setPubDateFormat(dto.getPubDateFormat()); // Allow clearing it

        return ResponseEntity.ok(rssSourceRepository.save(source));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSource(@PathVariable Integer id) {
        RssSource source = rssSourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RSS Source not found"));
        if (Boolean.TRUE.equals(source.getIsDefault())) {
            throw new RuntimeException("Default configurations cannot be deleted");
        }
        rssSourceRepository.delete(source);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/test")
    public ResponseEntity<TestRssResponseDto> testSource(@RequestBody TestRssRequestDto requestDto) {
        log.info("Testing RSS source URL: {}", requestDto.getUrl());
        
        WebClient webClient = webClientBuilder.baseUrl(nlpApiUrl).build();
        
        try {
            TestRssResponseDto response = webClient.post()
                    .uri("/api/rss/test")
                    .bodyValue(requestDto)
                    .retrieve()
                    .bodyToMono(TestRssResponseDto.class)
                    .block();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to call nlp-api RSS testing endpoint: {}", e.getMessage(), e);
            TestRssResponseDto fallback = new TestRssResponseDto();
            fallback.setSuccess(false);
            if (isConnectionError(e)) {
                fallback.setMessage("The NLP engine is starting up and loading AI models (e.g. FinBERT, NER). Please wait 1-2 minutes and try again.");
            } else {
                fallback.setMessage("Failed to contact NLP testing service: " + e.getMessage());
            }
            return ResponseEntity.status(503).body(fallback);
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
