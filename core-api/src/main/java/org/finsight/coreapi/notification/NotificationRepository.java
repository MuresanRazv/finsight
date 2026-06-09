package org.finsight.coreapi.notification;

import org.finsight.coreapi.notification.Notification;
import org.finsight.coreapi.user.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    @EntityGraph(attributePaths = {"article"})
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    @EntityGraph(attributePaths = {"article"})
    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
}
