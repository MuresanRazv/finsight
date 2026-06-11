package org.finsight.coreapi.article;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.finsight.coreapi.user.User;
import org.finsight.coreapi.user.UserRepository;
import org.finsight.coreapi.user.UserUsageLimitService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
@Slf4j
public class ArticleController {

    private final UserArticleProcessingRequestRepository processingRequestRepository;
    private final UserRepository userRepository;
    private final WebClient.Builder webClientBuilder;
    private final ArticleRepository articleRepository;
    private final EntitySentimentRepository entitySentimentRepository;
    private final UserUsageLimitService userUsageLimitService;

    @Value("${nlp.api.url}")
    private String nlpApiUrl;

    @PostMapping("/process")
    public ResponseEntity<?> processArticle(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ProcessArticleRequestDto requestDto
    ) {
        log.info("User {} requested manual processing of URL: {}", userDetails.getUsername(), requestDto.getUrl());

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        userUsageLimitService.checkAndIncrementIngestion(user, 1);

        // Save a new pending request
        UserArticleProcessingRequest request = UserArticleProcessingRequest.builder()
                .user(user)
                .url(requestDto.getUrl())
                .status("PENDING")
                .source(requestDto.getSource())
                .createdAt(OffsetDateTime.now())
                .build();
        UserArticleProcessingRequest savedRequest = processingRequestRepository.save(request);

        // Prepare request payload for nlp-api
        NlpProcessRequestDto nlpRequest = new NlpProcessRequestDto(
                requestDto.getUrl(),
                requestDto.getTitle(),
                requestDto.getText(),
                requestDto.getSource(),
                user.getId()
        );

        WebClient webClient = webClientBuilder.baseUrl(nlpApiUrl).build();

        try {
            webClient.post()
                    .uri("/api/process")
                    .bodyValue(nlpRequest)
                    .retrieve()
                    .toBodilessEntity()
                    .block(); // Synchronously wait for nlp-api to acknowledge and enqueue

            return ResponseEntity.ok(savedRequest);
        } catch (WebClientResponseException e) {
            log.error("Failed calling NLP API to process article: Status={}, Body={}", 
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            
            // Mark request as failed immediately
            savedRequest.setStatus("FAILED");
            savedRequest.setCompletedAt(OffsetDateTime.now());
            savedRequest.setErrorMessage(e.getResponseBodyAsString());
            processingRequestRepository.save(savedRequest);

            return ResponseEntity.status(e.getStatusCode())
                    .body("Failed to process article: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Error calling NLP API to process article: {}", e.getMessage(), e);

            savedRequest.setStatus("FAILED");
            savedRequest.setCompletedAt(OffsetDateTime.now());
            if (isConnectionError(e)) {
                String friendlyMsg = "The NLP engine is starting up and loading AI models (e.g. FinBERT, NER). Please try again in 1-2 minutes.";
                savedRequest.setErrorMessage(friendlyMsg);
                processingRequestRepository.save(savedRequest);
                return ResponseEntity.status(503).body(friendlyMsg);
            }
            savedRequest.setErrorMessage(e.getMessage());
            processingRequestRepository.save(savedRequest);

            return ResponseEntity.internalServerError()
                    .body("Error initiating article processing: " + e.getMessage());
        }
    }

    @GetMapping("/my-processing")
    public ResponseEntity<org.springframework.data.domain.Page<UserArticleProcessingRequest>> getMyProcessingRequests(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<UserArticleProcessingRequest> requests = 
                processingRequestRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/process/bulk")
    public ResponseEntity<?> processArticlesBulk(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody BulkProcessArticlesRequestDto requestDto
    ) {
        log.info("User {} requested manual bulk processing of {} URLs", 
                userDetails.getUsername(), requestDto.getUrls() != null ? requestDto.getUrls().size() : 0);

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (requestDto.getUrls() == null || requestDto.getUrls().isEmpty()) {
            return ResponseEntity.badRequest().body("No URLs provided");
        }

        userUsageLimitService.checkAndIncrementIngestion(user, requestDto.getUrls().size());

        // Save a PENDING request for each URL
        for (String url : requestDto.getUrls()) {
            UserArticleProcessingRequest request = UserArticleProcessingRequest.builder()
                    .user(user)
                    .url(url.trim())
                    .status("PENDING")
                    .createdAt(OffsetDateTime.now())
                    .build();
            processingRequestRepository.save(request);
        }

        // Call the NLP API bulk endpoint
        NlpBulkProcessRequestDto nlpRequest = new NlpBulkProcessRequestDto(
                requestDto.getUrls(),
                user.getId()
        );

        WebClient webClient = webClientBuilder.baseUrl(nlpApiUrl).build();

        try {
            webClient.post()
                    .uri("/api/process/bulk")
                    .bodyValue(nlpRequest)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            return ResponseEntity.ok().body("Bulk processing initiated");
        } catch (WebClientResponseException e) {
            log.error("Failed calling NLP API to bulk process articles: Status={}, Body={}", 
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            
            failPendingRequests(requestDto.getUrls(), user, e.getResponseBodyAsString());

            return ResponseEntity.status(e.getStatusCode())
                    .body("Failed to initiate bulk processing: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Error calling NLP API to bulk process articles: {}", e.getMessage(), e);

            if (isConnectionError(e)) {
                String friendlyMsg = "The NLP engine is starting up and loading AI models (e.g. FinBERT, NER). Please try again in 1-2 minutes.";
                failPendingRequests(requestDto.getUrls(), user, friendlyMsg);
                return ResponseEntity.status(503).body(friendlyMsg);
            }

            failPendingRequests(requestDto.getUrls(), user, e.getMessage());

            return ResponseEntity.internalServerError()
                    .body("Error initiating bulk processing: " + e.getMessage());
        }
    }


    @GetMapping("/detail/{uuid}")
    public ResponseEntity<AnalyzedArticleDto> getArticleDetailByUuid(
            @PathVariable("uuid") java.util.UUID uuid
    ) {
        log.info("Fetching article detail for UUID: {}", uuid);
        Article article = articleRepository.findByUuid(uuid)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        List<EntitySentimentDto> entityDtos = article.getEntities().stream()
                .map(e -> new EntitySentimentDto(
                        e.getName(),
                        e.getTicker(),
                        e.getSentimentScore(),
                        e.getSentimentLabel(),
                        e.getUuid()
                ))
                .collect(Collectors.toList());

        AnalyzedArticleDto dto = new AnalyzedArticleDto(
                article.getUrl(),
                article.getTitle(),
                article.getSource(),
                article.getOverallSentimentScore(),
                article.getOverallSentimentLabel(),
                entityDtos,
                article.getSemanticVectorId(),
                article.getProcessedAt(),
                null,
                article.getUuid()
        );

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/ticker/{ticker}")
    public ResponseEntity<List<TickerRelatedNewsDto>> getRelatedNews(
            @PathVariable("ticker") String ticker,
            @RequestParam(value = "limit", defaultValue = "3") int limit
    ) {
        log.info("Fetching related news for ticker: {} with limit: {}", ticker, limit);
        List<EntitySentiment> sentiments = entitySentimentRepository.findByTickerOrderByProcessedAtDesc(
                ticker.toUpperCase(),
                org.springframework.data.domain.PageRequest.of(0, limit)
        );

        List<TickerRelatedNewsDto> dtos = sentiments.stream().map(s -> new TickerRelatedNewsDto(
                s.getArticle() != null ? s.getArticle().getTitle() : "Related News Item",
                s.getArticle() != null ? s.getArticle().getSource() : "FinSight",
                s.getArticle() != null ? s.getArticle().getUrl() : "",
                s.getProcessedAt(),
                s.getSentimentLabel() != null ? s.getSentimentLabel().toLowerCase() : "neutral",
                s.getSentimentScore(),
                s.getArticle() != null ? s.getArticle().getUuid() : null
        )).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }


    private void failPendingRequests(List<String> urls, User user, String error) {
        for (String url : urls) {
            List<UserArticleProcessingRequest> requests = processingRequestRepository.findByUrlAndStatus(url.trim(), "PENDING");
            for (UserArticleProcessingRequest req : requests) {
                if (req.getUser().getId().equals(user.getId())) {
                    req.setStatus("FAILED");
                    req.setCompletedAt(OffsetDateTime.now());
                    req.setErrorMessage(error);
                    processingRequestRepository.save(req);
                }
            }
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
