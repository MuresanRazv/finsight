package org.finsight.coreapi.dto;

public record EntitySentimentDto(
        String name,
        String ticker,
        Double sentimentScore,
        String sentimentLabel
) {
}