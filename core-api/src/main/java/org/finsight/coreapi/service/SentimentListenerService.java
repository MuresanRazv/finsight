package org.finsight.coreapi.service;

import org.finsight.coreapi.domain.Article;
import org.finsight.coreapi.domain.EntitySentiment;
import org.finsight.coreapi.dto.AnalyzedArticleDto;
import org.finsight.coreapi.dto.EntitySentimentDto;
import org.finsight.coreapi.repository.ArticleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SentimentListenerService {

    private final ArticleRepository articleRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @RabbitListener(
            queues = "analyzed_sentiment"
    )
    @Transactional
    public void receiveMessage(final AnalyzedArticleDto message) {
        log.info("Received message for URL: {}", message.url());
        log.info("Message: {}", message);

        Article article = Article.builder()
                .url(message.url())
                .overallSentimentScore(message.overallSentimentScore())
                .overallSentimentLabel(message.overallSentimentLabel())
                .semanticVectorId(message.semanticVectorId())
                .processedAt(message.processedAt())
                .build();

        message.entities().forEach(entityDto -> {
            EntitySentiment entitySentiment = EntitySentiment.builder()
                    .name(entityDto.name())
                    .ticker(entityDto.ticker())
                    .sentimentScore(entityDto.sentimentScore())
                    .sentimentLabel(entityDto.sentimentLabel())
                    .build();
            article.addEntity(entitySentiment);
        });

        Article savedArticle = articleRepository.save(article);
        log.info("Saved article with URL: {}", savedArticle.getUrl());

        broadcastSentimentUpdate(savedArticle);
    }

    private void broadcastSentimentUpdate(Article article) {
        AnalyzedArticleDto articleDto = toDto(article);
        log.info("Broadcasting sentiment update for URL: {}", articleDto.url());
        messagingTemplate.convertAndSend("/topic/sentiments", articleDto);
    }

    private AnalyzedArticleDto toDto(Article article) {
        return new AnalyzedArticleDto(
                article.getUrl(),
                article.getOverallSentimentScore(),
                article.getOverallSentimentLabel(),
                article.getEntities().stream().map(this::toDto).collect(Collectors.toList()),
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
