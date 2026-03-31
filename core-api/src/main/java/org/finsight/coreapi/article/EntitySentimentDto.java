package org.finsight.coreapi.article;

public record EntitySentimentDto(
        String name,
        String ticker,
        Double sentimentScore,
        String sentimentLabel
) {
}