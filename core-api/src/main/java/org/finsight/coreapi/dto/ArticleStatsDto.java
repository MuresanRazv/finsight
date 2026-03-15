package org.finsight.coreapi.dto;

import java.util.List;

public record ArticleStatsDto(
        String url,
        String overallSentimentLabel,
        List<EntitySentimentDto> entities
) {}
