package org.finsight.coreapi.repository;

import org.finsight.coreapi.domain.Article;
import org.finsight.coreapi.domain.ArticleId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, ArticleId> {
    List<Article> findByProcessedAtBetween(OffsetDateTime start, OffsetDateTime end);
}