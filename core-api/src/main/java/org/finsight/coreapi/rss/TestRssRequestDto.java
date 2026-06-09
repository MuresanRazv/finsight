package org.finsight.coreapi.rss;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestRssRequestDto {
    private String url;
    private String itemSelector;
    private String titleSelector;
    private String linkSelector;
    private String linkAttribute;
    private String descriptionSelector;
    private String pubDateSelector;
    private String pubDateFormat;
}
