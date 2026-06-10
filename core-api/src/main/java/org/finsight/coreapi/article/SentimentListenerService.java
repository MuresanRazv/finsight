package org.finsight.coreapi.article;

import org.finsight.coreapi.user.User;
import org.finsight.coreapi.notification.Notification;
import org.finsight.coreapi.notification.NotificationRepository;
import org.finsight.coreapi.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SentimentListenerService {

    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserArticleProcessingRequestRepository processingRequestRepository;

    @RabbitListener(
            queues = "analyzed_sentiment"
    )
    @Transactional
    public void receiveMessage(final AnalyzedArticleDto message) {
        log.info("Received message for URL: {}", message.url());

        try {
            Article savedArticle = null;
            if (articleRepository.findFirstByUrl(message.url()).isPresent()) {
                log.info("Article with URL {} already exists. Skipping processing.", message.url());
                savedArticle = articleRepository.findFirstByUrl(message.url()).get();
            } else {
                Article article = Article.builder()
                        .url(message.url())
                        .processedAt(message.processedAt())
                        .title(message.title())
                        .source(message.source())
                        .overallSentimentScore(message.overallSentimentScore())
                        .overallSentimentLabel(message.overallSentimentLabel())
                        .semanticVectorId(message.semanticVectorId())
                        .build();

                if (message.entities() != null) {
                    message.entities().forEach(entityDto -> {
                        EntitySentiment sentiment = EntitySentiment.builder()
                                .name(entityDto.name())
                                .ticker(entityDto.ticker())
                                .sentimentScore(entityDto.sentimentScore())
                                .sentimentLabel(entityDto.sentimentLabel())
                                .build();

                        article.addEntity(sentiment);
                    });
                }

                savedArticle = articleRepository.save(article);
                log.info("Successfully saved article and {} sentiments to TimescaleDB for URL: {}",
                        savedArticle.getEntities().size(), savedArticle.getUrl());

                broadcastSentimentUpdate(savedArticle, savedArticle.getEntities());
            }

            // Update processing requests matching the URL to COMPLETED
            updateProcessingRequests(message, savedArticle.getUuid(), "COMPLETED", null);

        } catch (Exception e) {
            log.error("Failed to process and save sentiment message for URL: {}. Error: {}",
                    message.url(), e.getMessage(), e);
            if (message.requestedByUserId() != null) {
                markRequestAsFailed(message.url(), message.requestedByUserId(), "Failed to save article in DB: " + e.getMessage());
            }
        }
    }

    @RabbitListener(
            queues = "analyzed_sentiment_failed"
    )
    @Transactional
    public void receiveFailureMessage(final FailedArticleDto message) {
        log.info("Received failure message for URL: {}, user ID: {}, error: {}", 
                message.url(), message.requestedByUserId(), message.errorMessage());
        
        try {
            List<UserArticleProcessingRequest> requests = processingRequestRepository.findByUrlAndStatus(message.url(), "PENDING");
            for (UserArticleProcessingRequest req : requests) {
                if (message.requestedByUserId() == null || req.getUser().getId().equals(message.requestedByUserId())) {
                    req.setStatus("FAILED");
                    req.setCompletedAt(OffsetDateTime.now());
                    req.setErrorMessage(message.errorMessage());
                    processingRequestRepository.save(req);
                    log.info("Updated request ID {} status to FAILED", req.getId());
                }
            }
        } catch (Exception e) {
            log.error("Failed to update failure status for URL: {}", message.url(), e);
        }
    }

    private void updateProcessingRequests(AnalyzedArticleDto message, java.util.UUID articleUuid, String status, String errorMessage) {
        List<UserArticleProcessingRequest> requests = processingRequestRepository.findByUrlAndStatus(message.url(), "PENDING");
        if (!requests.isEmpty()) {
            log.info("Found {} pending processing requests for URL: {}", requests.size(), message.url());
            for (UserArticleProcessingRequest req : requests) {
                req.setStatus(status);
                req.setCompletedAt(OffsetDateTime.now());
                req.setArticleTitle(message.title());
                req.setArticleSentimentLabel(message.overallSentimentLabel());
                req.setArticleSentimentScore(message.overallSentimentScore());
                req.setArticleProcessedAt(message.processedAt());
                req.setArticleUuid(articleUuid);
                req.setErrorMessage(errorMessage);
                processingRequestRepository.save(req);
            }
        }
    }

    private void markRequestAsFailed(String url, Integer userId, String errorMessage) {
        List<UserArticleProcessingRequest> requests = processingRequestRepository.findByUrlAndStatus(url, "PENDING");
        for (UserArticleProcessingRequest req : requests) {
            if (req.getUser().getId().equals(userId)) {
                req.setStatus("FAILED");
                req.setCompletedAt(OffsetDateTime.now());
                req.setErrorMessage(errorMessage);
                processingRequestRepository.save(req);
            }
        }
    }

    private void broadcastSentimentUpdate(Article article, List<EntitySentiment> sentiments) {
        AnalyzedArticleDto articleDto = toDto(article, sentiments);
        log.info("Broadcasting sentiment update for URL: {}", articleDto.url());
        
        // Broadcast to general topic
        messagingTemplate.convertAndSend("/topic/sentiments", articleDto);

        // Broadcast to specific ticker topics
        sentiments.stream()
                .filter(s -> s.getTicker() != null)
                .forEach(sentiment -> {
                    String ticker = sentiment.getTicker();
                    // Broadcast to /topic/ticker/{ticker}
                    String destination = "/topic/ticker/" + ticker;
                    messagingTemplate.convertAndSend(destination, articleDto);

                    // Broadcast to users watching this ticker
                    String jsonTicker = "[\"" + ticker + "\"]";
                    List<User> interestedUsers = userRepository.findUsersWatchingTicker(jsonTicker);
                    
                    interestedUsers.forEach(user -> {
                        log.info("Sending update for ticker {} to user {}", ticker, user.getEmail());

                        // Save persistent notification
                        Notification notification = Notification.builder()
                                .user(user)
                                .ticker(ticker)
                                .articleUrl(article.getUrl())
                                .articleProcessedAt(article.getProcessedAt())
                                .sentimentScore(sentiment.getSentimentScore())
                                .sentimentLabel(sentiment.getSentimentLabel())
                                .build();
                        notificationRepository.save(notification);

                        // Broadcast to users watchlist
                        messagingTemplate.convertAndSendToUser(
                            user.getEmail(), 
                            "/queue/watchlist", 
                            articleDto
                        );
                    });
                });
    }

    private AnalyzedArticleDto toDto(Article article, List<EntitySentiment> sentiments) {
        return new AnalyzedArticleDto(
                article.getUrl(),
                article.getTitle(),
                article.getSource(),
                article.getOverallSentimentScore(),
                article.getOverallSentimentLabel(),
                sentiments.stream().map(this::toDto).collect(Collectors.toList()),
                article.getSemanticVectorId(),
                article.getProcessedAt(),
                null,
                article.getUuid()
        );
    }

    private EntitySentimentDto toDto(EntitySentiment entity) {
        return new EntitySentimentDto(
                entity.getName(),
                entity.getTicker(),
                entity.getSentimentScore(),
                entity.getSentimentLabel(),
                entity.getUuid()
        );
    }
}