package org.finsight.coreapi.article;

import org.finsight.coreapi.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserArticleProcessingRequestRepository extends JpaRepository<UserArticleProcessingRequest, Integer> {
    org.springframework.data.domain.Page<UserArticleProcessingRequest> findByUserOrderByCreatedAtDesc(User user, org.springframework.data.domain.Pageable pageable);
    List<UserArticleProcessingRequest> findByUrlAndStatus(String url, String status);
}
