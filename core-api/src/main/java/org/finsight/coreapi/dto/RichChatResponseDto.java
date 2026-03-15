package org.finsight.coreapi.dto;

import java.util.List;

public record RichChatResponseDto(
        String answer,
        List<ArticleStatsDto> sources
) {}
