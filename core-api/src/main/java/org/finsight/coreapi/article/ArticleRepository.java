package org.finsight.coreapi.article;

import org.finsight.coreapi.article.Article;
import org.finsight.coreapi.article.ArticleId;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, ArticleId> {
    List<Article> findByProcessedAtBetween(OffsetDateTime start, OffsetDateTime end);

    @EntityGraph(attributePaths = {"entities"})
    List<Article> findByUrlIn(List<String> urls);

    @EntityGraph(attributePaths = {"entities"})
    @org.springframework.data.jpa.repository.Query("SELECT a FROM Article a")
    List<Article> findAllWithEntities();
}
