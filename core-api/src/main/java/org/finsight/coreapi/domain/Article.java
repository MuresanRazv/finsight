package org.finsight.coreapi.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "articles")
@IdClass(ArticleId.class)
public class Article {

    @Id
    private String url;

    @Id
    @Column(name = "processed_at", nullable = false)
    private OffsetDateTime processedAt;

    private Double overallSentimentScore;
    private String overallSentimentLabel;
    private String semanticVectorId;

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EntitySentiment> entities = new ArrayList<>();

    public void addEntity(EntitySentiment entity) {
        entities.add(entity);
        entity.setArticle(this);
        entity.setProcessedAt(this.processedAt);
    }

    public void removeEntity(EntitySentiment entity) {
        entities.remove(entity);
        entity.setArticle(null);
    }
}