package org.finsight.coreapi.article;

import java.time.OffsetDateTime;

public record TickerRelatedNewsDto(
    String title,
    String source,
    String url,
    OffsetDateTime processedAt,
    String sentiment,
    Double sentimentScore,
    java.util.UUID uuid
) {}
