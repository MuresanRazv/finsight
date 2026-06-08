package org.finsight.coreapi.article;

public record FailedArticleDto(
        String url,
        Integer requestedByUserId,
        String errorMessage
) {
}
