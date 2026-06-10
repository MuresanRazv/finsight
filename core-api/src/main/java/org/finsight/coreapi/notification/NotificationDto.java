package org.finsight.coreapi.notification;

import java.time.OffsetDateTime;
import java.util.List;
import org.finsight.coreapi.article.EntitySentimentDto;

public record NotificationDto(
    Integer id,
    String ticker,
    String articleUrl,
    OffsetDateTime articleProcessedAt,
    Double sentimentScore,
    String sentimentLabel,
    Boolean isRead,
    OffsetDateTime createdAt,
    String source,
    String articleTitle,
    Double articleOverallSentimentScore,
    String articleOverallSentimentLabel,
    List<EntitySentimentDto> articleEntities,
    java.util.UUID articleUuid
) {}

