package org.finsight.coreapi.rss;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RssSourceRepository extends JpaRepository<RssSource, Integer> {
    List<RssSource> findByIsEnabledTrue();
}
