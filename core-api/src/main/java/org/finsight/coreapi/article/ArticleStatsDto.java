package org.finsight.coreapi.article;

import java.util.List;

public record ArticleStatsDto(
        String url,
        String overallSentimentLabel,
        List<EntitySentimentDto> entities
) {}
