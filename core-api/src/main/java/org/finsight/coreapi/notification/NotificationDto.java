package org.finsight.coreapi.notification;

import java.time.OffsetDateTime;

public record NotificationDto(
    Integer id,
    String ticker,
    String articleUrl,
    OffsetDateTime articleProcessedAt,
    Double sentimentScore,
    String sentimentLabel,
    Boolean isRead,
    OffsetDateTime createdAt
) {}
