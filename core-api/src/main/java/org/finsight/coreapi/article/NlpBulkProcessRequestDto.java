package org.finsight.coreapi.article;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NlpBulkProcessRequestDto {
    private List<String> urls;
    private Integer userId;
}
