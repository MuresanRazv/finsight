package org.finsight.coreapi.article;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
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

    @Column(name = "processed_at", nullable = false)
    private OffsetDateTime processedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "article_url", referencedColumnName = "url"),
            @JoinColumn(name = "article_processed_at", referencedColumnName = "processed_at")
    })
    private Article article;
}