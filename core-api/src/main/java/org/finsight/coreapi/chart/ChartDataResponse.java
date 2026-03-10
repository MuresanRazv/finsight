package org.finsight.coreapi.chart;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ChartDataResponse {
    private String chartId;
    private String title;
    private String description;
    private List<FilterDefinition> availableFilters;
    private Object data; // Flexible payload (e.g., List<ArticleDTO>, TimeSeriesData, etc.)
}
