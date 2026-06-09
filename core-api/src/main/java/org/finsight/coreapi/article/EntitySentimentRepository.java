package org.finsight.coreapi.article;

import org.finsight.coreapi.article.EntitySentiment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;

public interface EntitySentimentRepository extends JpaRepository<EntitySentiment, Long> {
    List<EntitySentiment> findByArticleUrl(String articleUrl);
    List<EntitySentiment> findByProcessedAtAfter(OffsetDateTime processedAt);
    List<EntitySentiment> findByTickerAndProcessedAtAfter(String ticker, OffsetDateTime processedAt);
    List<EntitySentiment> findByTickerInAndProcessedAtAfter(Collection<String> tickers, OffsetDateTime processedAt);

    @EntityGraph(attributePaths = {"article"})
    List<EntitySentiment> findByTickerOrderByProcessedAtDesc(String ticker, Pageable pageable);
}
