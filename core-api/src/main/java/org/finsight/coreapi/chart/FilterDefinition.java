package org.finsight.coreapi.chart;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FilterDefinition {
    private String key;
    private String label;
    private FilterType type;
    private List<String> options; // For SELECT/MULTI_SELECT
    private Object defaultValue;
}
