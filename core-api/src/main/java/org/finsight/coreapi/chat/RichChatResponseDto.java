package org.finsight.coreapi.chat;

import org.finsight.coreapi.article.ArticleStatsDto;

import java.util.List;

public record RichChatResponseDto(
        String answer,
        List<ArticleStatsDto> sources
) {}
