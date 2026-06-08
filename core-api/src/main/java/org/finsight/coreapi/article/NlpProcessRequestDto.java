package org.finsight.coreapi.article;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NlpProcessRequestDto {
    private String url;
    private String title;
    private String text;
    private String source;
    private Integer userId;
}
