package org.finsight.coreapi.article;

import jakarta.persistence.*;
import lombok.*;
import org.finsight.coreapi.user.User;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_article_processing_requests")
public class UserArticleProcessingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String status; // PENDING, COMPLETED, FAILED

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "article_title")
    private String articleTitle;

    @Column(name = "article_sentiment_label")
    private String articleSentimentLabel;

    @Column(name = "article_sentiment_score")
    private Double articleSentimentScore;

    @Column(name = "error_message")
    private String errorMessage;
}
