package org.finsight.coreapi.article;

import java.time.OffsetDateTime;
import java.util.List;

public record AnalyzedArticleDto(
        String url,
        String title,
        String source,
        Double overallSentimentScore,
        String overallSentimentLabel,
        List<EntitySentimentDto> entities,
        String semanticVectorId,
        OffsetDateTime processedAt,
        Integer requestedByUserId,
        java.util.UUID uuid
) {
}
