package org.finsight.coreapi.repository;

import org.finsight.coreapi.domain.EntitySentiment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntitySentimentRepository extends JpaRepository<EntitySentiment, Long> {
}