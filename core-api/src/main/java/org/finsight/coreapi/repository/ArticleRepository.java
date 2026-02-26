package org.finsight.coreapi.repository;

import org.finsight.coreapi.domain.Article;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArticleRepository extends JpaRepository<Article, String> {
}