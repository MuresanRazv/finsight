package org.finsight.coreapi.repository;

import org.finsight.coreapi.domain.EntitySentiment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EntitySentimentRepository extends JpaRepository<EntitySentiment, Long> {
    List<EntitySentiment> findByArticleUrl(String articleUrl);
}