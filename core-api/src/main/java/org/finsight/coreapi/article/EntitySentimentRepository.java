package org.finsight.coreapi.article;

import org.finsight.coreapi.article.EntitySentiment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;

public interface EntitySentimentRepository extends JpaRepository<EntitySentiment, Long> {
    List<EntitySentiment> findByArticleUrl(String articleUrl);
    List<EntitySentiment> findByProcessedAtAfter(OffsetDateTime processedAt);
    List<EntitySentiment> findByTickerAndProcessedAtAfter(String ticker, OffsetDateTime processedAt);
    List<EntitySentiment> findByTickerInAndProcessedAtAfter(Collection<String> tickers, OffsetDateTime processedAt);
}
