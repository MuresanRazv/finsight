package org.finsight.coreapi.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String ticker;

    @Column(name = "article_url", nullable = false)
    private String articleUrl;

    @Column(name = "article_processed_at", nullable = false)
    private OffsetDateTime articleProcessedAt;

    @Column(nullable = false)
    private Double sentimentScore;

    @Column(nullable = false)
    private String sentimentLabel;

    @Builder.Default
    private Boolean isRead = false;

    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "article_url", referencedColumnName = "url", insertable = false, updatable = false),
            @JoinColumn(name = "article_processed_at", referencedColumnName = "processed_at", insertable = false, updatable = false)
    })
    private Article article;
}
