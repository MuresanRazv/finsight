package org.finsight.coreapi.service;

import org.finsight.coreapi.domain.Article;
import org.finsight.coreapi.domain.EntitySentiment;
import org.finsight.coreapi.domain.User;
import org.finsight.coreapi.dto.AnalyzedArticleDto;
import org.finsight.coreapi.dto.EntitySentimentDto;
import org.finsight.coreapi.repository.ArticleRepository;
import org.finsight.coreapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SentimentListenerService {

    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @RabbitListener(
            queues = "analyzed_sentiment"
    )
    @Transactional
    public void receiveMessage(final AnalyzedArticleDto message) {
        log.info("Received message for URL: {}", message.url());

        try {
            Article article = Article.builder()
                    .url(message.url())
                    .overallSentimentScore(message.overallSentimentScore())
                    .overallSentimentLabel(message.overallSentimentLabel())
                    .semanticVectorId(message.semanticVectorId())
                    .processedAt(message.processedAt())
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

            Article savedArticle = articleRepository.save(article);
            log.info("Successfully saved article and {} sentiments to TimescaleDB for URL: {}",
                    savedArticle.getEntities().size(), savedArticle.getUrl());

            broadcastSentimentUpdate(savedArticle, savedArticle.getEntities());
        } catch (Exception e) {
            log.error("Failed to process and save sentiment message for URL: {}. Error: {}",
                    message.url(), e.getMessage(), e);
        }
    }

    private void broadcastSentimentUpdate(Article article, List<EntitySentiment> sentiments) {
        AnalyzedArticleDto articleDto = toDto(article, sentiments);
        log.info("Broadcasting sentiment update for URL: {}", articleDto.url());
        
        // Broadcast to general topic
        messagingTemplate.convertAndSend("/topic/sentiments", articleDto);

        // Broadcast to specific ticker topics
        sentiments.stream()
                .map(EntitySentiment::getTicker)
                .distinct()
                .forEach(ticker -> {
                    // Broadcast to /topic/ticker/{ticker}
                    String destination = "/topic/ticker/" + ticker;
                    messagingTemplate.convertAndSend(destination, articleDto);

                    // Broadcast to users watching this ticker
                    // We need to wrap the ticker in quotes and brackets to match JSON array containment check
                    // The query checks if settings->'tickers' contains the ticker
                    // Assuming settings->'tickers' is a JSON array of strings ["AAPL", "MSFT"]
                    // The query is: settings -> 'tickers' @> '["AAPL"]'
                    String jsonTicker = "[\"" + ticker + "\"]";
                    List<User> interestedUsers = userRepository.findUsersWatchingTicker(jsonTicker);
                    
                    interestedUsers.forEach(user -> {
                        log.info("Sending update for ticker {} to user {}", ticker, user.getEmail());
                        // This sends to /user/{username}/queue/watchlist
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
                article.getOverallSentimentScore(),
                article.getOverallSentimentLabel(),
                sentiments.stream().map(this::toDto).collect(Collectors.toList()),
                article.getSemanticVectorId(),
                article.getProcessedAt()
        );
    }

    private EntitySentimentDto toDto(EntitySentiment entity) {
        return new EntitySentimentDto(
                entity.getName(),
                entity.getTicker(),
                entity.getSentimentScore(),
                entity.getSentimentLabel()
        );
    }
}