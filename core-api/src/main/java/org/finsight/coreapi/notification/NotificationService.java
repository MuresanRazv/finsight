package org.finsight.coreapi.notification;

import org.finsight.coreapi.notification.Notification;
import org.finsight.coreapi.user.User;
import org.finsight.coreapi.notification.NotificationDto;
import org.finsight.coreapi.notification.NotificationRepository;
import org.finsight.coreapi.article.EntitySentimentDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadUserNotifications(User user) {
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Integer notificationId, User user) {
        notificationRepository.findById(notificationId)
                .filter(n -> n.getUser().getId().equals(user.getId()))
                .ifPresent(n -> {
                    n.setIsRead(true);
                    notificationRepository.save(n);
                });
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    public NotificationDto toDto(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getTicker(),
                notification.getArticleUrl(),
                notification.getArticleProcessedAt(),
                notification.getSentimentScore(),
                notification.getSentimentLabel(),
                notification.getIsRead(),
                notification.getCreatedAt(),
                notification.getArticle() != null ? notification.getArticle().getSource() : null,
                notification.getArticle() != null ? notification.getArticle().getTitle() : null,
                notification.getArticle() != null ? notification.getArticle().getOverallSentimentScore() : null,
                notification.getArticle() != null ? notification.getArticle().getOverallSentimentLabel() : null,
                notification.getArticle() != null ? notification.getArticle().getEntities().stream()
                        .map(e -> new EntitySentimentDto(
                                e.getName(),
                                e.getTicker(),
                                e.getSentimentScore(),
                                e.getSentimentLabel(),
                                e.getUuid()
                        ))
                        .collect(Collectors.toList()) : List.of(),
                notification.getArticle() != null ? notification.getArticle().getUuid() : null
        );
    }
}
