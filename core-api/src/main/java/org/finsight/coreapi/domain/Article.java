package org.finsight.coreapi.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "articles")
public class Article {

    @Id
    private String url;

    private Double overallSentimentScore;
    private String overallSentimentLabel;
    private String semanticVectorId;
    private OffsetDateTime processedAt;

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EntitySentiment> entities = new ArrayList<>();

    public void addEntity(EntitySentiment entity) {
        entities.add(entity);
        entity.setArticle(this);
    }

    public void removeEntity(EntitySentiment entity) {
        entities.remove(entity);
        entity.setArticle(null);
    }
}
