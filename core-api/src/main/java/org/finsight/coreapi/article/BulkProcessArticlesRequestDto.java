package org.finsight.coreapi.article;

import lombok.Data;
import java.util.List;

@Data
public class BulkProcessArticlesRequestDto {
    private List<String> urls;
}
