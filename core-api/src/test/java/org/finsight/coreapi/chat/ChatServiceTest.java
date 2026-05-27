package org.finsight.coreapi.chat;

import org.finsight.coreapi.article.Article;
import org.finsight.coreapi.article.ArticleRepository;
import org.finsight.coreapi.article.EntitySentiment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private WebClient.Builder webClientBuilder;
    @Mock
    private ArticleRepository articleRepository;

    @InjectMocks
    private ChatService chatService;

    private WebClient webClient;
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;
    private WebClient.RequestHeadersSpec requestHeadersSpec;
    private WebClient.RequestBodySpec requestBodySpec;
    private WebClient.ResponseSpec responseSpec;

    @BeforeEach
    void setUp() {
        webClient = mock(WebClient.class);
        requestBodyUriSpec = mock(WebClient.RequestBodyUriSpec.class);
        requestHeadersSpec = mock(WebClient.RequestHeadersSpec.class);
        requestBodySpec = mock(WebClient.RequestBodySpec.class);
        responseSpec = mock(WebClient.ResponseSpec.class);

        when(webClientBuilder.baseUrl(anyString())).thenReturn(webClientBuilder);
        when(webClientBuilder.build()).thenReturn(webClient);
        
        ReflectionTestUtils.setField(chatService, "nlpApiUrl", "http://localhost:8000");
    }

    @Test
    void processChatQuery_ShouldReturnRichResponse_WhenNlpReturnsSources() {
        ChatRequestDto request = new ChatRequestDto("What is happening with AAPL?");
        NlpChatResponseDto nlpResponse = new NlpChatResponseDto();
        nlpResponse.setAnswer("AAPL is doing well.");
        nlpResponse.setSourceUrls(List.of("http://example.com"));

        Article article = Article.builder()
                .url("http://example.com")
                .overallSentimentLabel("Positive")
                .entities(List.of(EntitySentiment.builder().ticker("AAPL").sentimentScore(0.9).sentimentLabel("Positive").build()))
                .build();

        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri("/api/chat")).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(request)).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(NlpChatResponseDto.class)).thenReturn(Mono.just(nlpResponse));

        when(articleRepository.findByUrlIn(List.of("http://example.com"))).thenReturn(List.of(article));

        RichChatResponseDto result = chatService.processChatQuery(request);

        assertThat(result.answer()).isEqualTo("AAPL is doing well.");
        assertThat(result.sources()).hasSize(1);
        assertThat(result.sources().get(0).url()).isEqualTo("http://example.com");
    }

    @Test
    void processChatQuery_ShouldReturnSimpleResponse_WhenNlpReturnsNoSources() {
        ChatRequestDto request = new ChatRequestDto("Hello");
        NlpChatResponseDto nlpResponse = new NlpChatResponseDto();
        nlpResponse.setAnswer("Hi there!");
        nlpResponse.setSourceUrls(Collections.emptyList());

        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri("/api/chat")).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(request)).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(NlpChatResponseDto.class)).thenReturn(Mono.just(nlpResponse));

        RichChatResponseDto result = chatService.processChatQuery(request);

        assertThat(result.answer()).isEqualTo("Hi there!");
        assertThat(result.sources()).isEmpty();
    }
}
