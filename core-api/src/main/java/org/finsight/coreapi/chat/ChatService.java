package org.finsight.coreapi.chat;

import lombok.RequiredArgsConstructor;
import org.finsight.coreapi.article.Article;
import org.finsight.coreapi.article.ArticleRepository;
import org.finsight.coreapi.article.ArticleStatsDto;
import org.finsight.coreapi.article.EntitySentimentDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final WebClient.Builder webClientBuilder;
    private final ArticleRepository articleRepository;

    @Value("${nlp.api.url}")
    private String nlpApiUrl;

    public RichChatResponseDto processChatQuery(ChatRequestDto chatRequest) {
        WebClient webClient = webClientBuilder.baseUrl(nlpApiUrl).build();

        try {
            NlpChatResponseDto nlpResponse = webClient.post()
                    .uri("/api/chat")
                    .bodyValue(chatRequest)
                    .retrieve()
                    .bodyToMono(NlpChatResponseDto.class)
                    .block();

            if (nlpResponse == null || nlpResponse.getSourceUrls() == null || nlpResponse.getSourceUrls().isEmpty()) {
                return new RichChatResponseDto(
                        nlpResponse != null ? nlpResponse.getAnswer() : "No response from NLP Engine.",
                        Collections.emptyList()
                );
            }

            List<Article> articles = articleRepository.findByUrlIn(nlpResponse.getSourceUrls());

            List<ArticleStatsDto> articleStats = articles.stream()
                    .map(article -> new ArticleStatsDto(
                            article.getUrl(),
                            article.getTitle(),
                            article.getSource(),
                            article.getOverallSentimentLabel(),
                            article.getEntities().stream()
                                    .map(entity -> new EntitySentimentDto(
                                            entity.getName(),
                                            entity.getTicker(),
                                            entity.getSentimentScore(),
                                            entity.getSentimentLabel()
                                    ))
                                    .toList()
                    ))
                    .toList();

            return new RichChatResponseDto(nlpResponse.getAnswer(), articleStats);
        } catch (Exception e) {
            if (isConnectionError(e)) {
                return new RichChatResponseDto(
                        "The NLP engine is starting up and loading AI models (e.g. LLM, FinBERT). Please try again in 1-2 minutes.",
                        Collections.emptyList()
                );
            }
            throw e;
        }
    }

    private boolean isConnectionError(Throwable e) {
        if (e == null) return false;
        String msg = e.getMessage();
        if (msg != null && (msg.contains("Connection refused") || msg.contains("finishConnect") || msg.contains("connection refused") || msg.contains("ConnectException"))) {
            return true;
        }
        return isConnectionError(e.getCause());
    }
}
