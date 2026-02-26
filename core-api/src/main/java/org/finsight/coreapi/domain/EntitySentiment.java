package org.finsight.coreapi.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "entity_sentiments")
public class EntitySentiment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    private String ticker;

    private Double sentimentScore;
    private String sentimentLabel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_url")
    private Article article;
}