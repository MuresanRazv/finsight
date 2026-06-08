package org.finsight.coreapi.article;

import lombok.Data;

@Data
public class ProcessArticleRequestDto {
    private String url;
    private String title;
    private String text;
    private String source;
}
