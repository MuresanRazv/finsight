package org.finsight.coreapi.notification;

import org.finsight.coreapi.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User user;
    private Notification notification;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1).email("user@example.com").build();
        notification = Notification.builder()
                .id(1)
                .user(user)
                .ticker("AAPL")
                .articleUrl("http://example.com/article")
                .articleProcessedAt(OffsetDateTime.now())
                .sentimentScore(0.8)
                .sentimentLabel("Positive")
                .isRead(false)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    @Test
    void getUserNotifications_ShouldReturnList() {
        when(notificationRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(notification));

        List<NotificationDto> result = notificationService.getUserNotifications(user);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).ticker()).isEqualTo("AAPL");
    }

    @Test
    void getUnreadUserNotifications_ShouldReturnList() {
        when(notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user)).thenReturn(List.of(notification));

        List<NotificationDto> result = notificationService.getUnreadUserNotifications(user);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).isRead()).isFalse();
    }

    @Test
    void markAsRead_ShouldUpdateNotification_WhenExistsAndBelongsToUser() {
        when(notificationRepository.findById(1)).thenReturn(Optional.of(notification));

        notificationService.markAsRead(1, user);

        assertThat(notification.getIsRead()).isTrue();
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_ShouldNotUpdate_WhenNotificationDoesNotBelongToUser() {
        User otherUser = User.builder().id(2).build();
        when(notificationRepository.findById(1)).thenReturn(Optional.of(notification));

        notificationService.markAsRead(1, otherUser);

        assertThat(notification.getIsRead()).isFalse();
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAllAsRead_ShouldUpdateAllUnread() {
        Notification notification2 = Notification.builder().id(2).user(user).isRead(false).build();
        when(notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user)).thenReturn(List.of(notification, notification2));

        notificationService.markAllAsRead(user);

        assertThat(notification.getIsRead()).isTrue();
        assertThat(notification2.getIsRead()).isTrue();
        verify(notificationRepository).saveAll(anyList());
    }
}
