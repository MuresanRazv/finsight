package org.finsight.coreapi.rss;

import lombok.Data;

@Data
public class RssSourceDto {
    private String name;
    private String url;
    private Boolean isEnabled;
    private String itemSelector;
    private String titleSelector;
    private String linkSelector;
    private String linkAttribute;
    private String descriptionSelector;
    private String pubDateSelector;
    private String pubDateFormat;
    private Boolean isDefault;
}
