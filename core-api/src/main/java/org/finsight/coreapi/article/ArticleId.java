package org.finsight.coreapi.article;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.OffsetDateTime;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ArticleId implements Serializable {
    private String url;
    private OffsetDateTime processedAt;
}