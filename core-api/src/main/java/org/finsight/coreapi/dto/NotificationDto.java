package org.finsight.coreapi.dto;

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
