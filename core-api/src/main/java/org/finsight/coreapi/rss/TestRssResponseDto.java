package org.finsight.coreapi.rss;

import lombok.Data;
import java.util.List;

@Data
public class TestRssResponseDto {
    private boolean success;
    private String message;
    private List<PreviewArticleDto> articles;

    @Data
    public static class PreviewArticleDto {
        private String title;
        private String url;
        private String text;
        private String publishedAt;
    }
}
