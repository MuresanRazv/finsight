package org.finsight.coreapi.article;

import org.finsight.coreapi.notification.Notification;
import org.finsight.coreapi.notification.NotificationRepository;
import org.finsight.coreapi.user.User;
import org.finsight.coreapi.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SentimentListenerServiceTest {

    @Mock
    private ArticleRepository articleRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private SentimentListenerService sentimentListenerService;

    private AnalyzedArticleDto analyzedArticleDto;
    private User user;

    @BeforeEach
    void setUp() {
        analyzedArticleDto = new AnalyzedArticleDto(
                "http://example.com",
                "Test Article",
                0.8,
                "Positive",
                List.of(new EntitySentimentDto("Apple Inc.", "AAPL", 0.9, "Positive")),
                "vector-123",
                OffsetDateTime.now(),
                null
        );

        user = User.builder()
                .id(1)
                .email("user@example.com")
                .build();
    }

    @Test
    void receiveMessage_ShouldSaveArticleAndBroadcast_WhenArticleIsNew() {
        when(articleRepository.findFirstByUrl(anyString())).thenReturn(Optional.empty());
        when(articleRepository.save(any(Article.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findUsersWatchingTicker(anyString())).thenReturn(List.of(user));

        sentimentListenerService.receiveMessage(analyzedArticleDto);

        verify(articleRepository).save(any(Article.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/sentiments"), any(AnalyzedArticleDto.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/ticker/AAPL"), any(AnalyzedArticleDto.class));
        verify(notificationRepository).save(any(Notification.class));
        verify(messagingTemplate).convertAndSendToUser(eq("user@example.com"), eq("/queue/watchlist"), any(AnalyzedArticleDto.class));
    }

    @Test
    void receiveMessage_ShouldSkip_WhenArticleAlreadyExists() {
        when(articleRepository.findFirstByUrl(anyString())).thenReturn(Optional.of(new Article()));

        sentimentListenerService.receiveMessage(analyzedArticleDto);

        verify(articleRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }
}
