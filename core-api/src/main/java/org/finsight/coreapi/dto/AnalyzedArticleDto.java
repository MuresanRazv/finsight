package org.finsight.coreapi.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record AnalyzedArticleDto(
        String url,
        Double overallSentimentScore,
        String overallSentimentLabel,
        List<EntitySentimentDto> entities,
        String semanticVectorId,
        OffsetDateTime processedAt
) {
}
