package org.finsight.coreapi.search;

import lombok.Data;

@Data
public class SearchQuery {
    private String query;
    private Number limit = 10;
}
