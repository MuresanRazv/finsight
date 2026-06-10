package org.finsight.coreapi.chart;

import org.finsight.coreapi.article.Article;
import org.finsight.coreapi.article.ArticleRepository;
import org.finsight.coreapi.article.EntitySentiment;
import org.finsight.coreapi.article.EntitySentimentRepository;
import org.finsight.coreapi.user.UserSettingsDto;
import org.finsight.coreapi.user.UserSettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChartServiceTest {

    @Mock
    private ArticleRepository articleRepository;
    @Mock
    private EntitySentimentRepository entitySentimentRepository;
    @Mock
    private UserSettingsService userSettingsService;

    @InjectMocks
    private ChartService chartService;

    private Article article;
    private EntitySentiment entitySentiment;

    @BeforeEach
    void setUp() {
        entitySentiment = EntitySentiment.builder()
                .ticker("AAPL")
                .sentimentScore(0.8)
                .sentimentLabel("Positive")
                .name("Apple Inc.")
                .processedAt(OffsetDateTime.now())
                .build();

        article = Article.builder()
                .url("http://example.com")
                .title("Test Article")
                .processedAt(OffsetDateTime.now())
                .overallSentimentScore(0.7)
                .overallSentimentLabel("Positive")
                .entities(List.of(entitySentiment))
                .build();
    }

    @Test
    @SuppressWarnings("unchecked")
    void getLatestArticles_ShouldReturnChartData() {
        Page<Article> page = new PageImpl<>(List.of(article));
        when(articleRepository.findAll(any(PageRequest.class))).thenReturn(page);

        ChartDataResponse response = chartService.getLatestArticles(Map.of("limit", "5"));

        assertThat(response.getChartId()).isEqualTo("latest-articles");
        List<?> dataList = (List<?>) response.getData();
        assertThat(dataList).hasSize(1);

        Map<String, Object> mappedArticle = (Map<String, Object>) dataList.get(0);
        assertThat(mappedArticle.get("uuid")).isEqualTo(article.getUuid().toString());

        List<Map<String, Object>> entities = (List<Map<String, Object>>) mappedArticle.get("entities");
        assertThat(entities).hasSize(1);
        assertThat(entities.get(0).get("uuid")).isEqualTo(entitySentiment.getUuid().toString());
    }

    @Test
    void getPopularTickers_ShouldReturnChartData() {
        when(entitySentimentRepository.findByProcessedAtAfter(any(OffsetDateTime.class)))
                .thenReturn(List.of(entitySentiment));

        ChartDataResponse response = chartService.getPopularTickers(Collections.emptyMap());

        assertThat(response.getChartId()).isEqualTo("popular-tickers");
        assertThat((List<?>) response.getData()).hasSize(1);
    }

    @Test
    void getMyTickers_ShouldReturnChartData_WhenUserHasTickers() {
        when(userSettingsService.getUserSettings("user@example.com"))
                .thenReturn(new UserSettingsDto(List.of("AAPL")));
        when(entitySentimentRepository.findByTickerInAndProcessedAtAfter(anyList(), any(OffsetDateTime.class)))
                .thenReturn(List.of(entitySentiment));

        ChartDataResponse response = chartService.getMyTickers(Map.of("ticker", "AAPL"), "user@example.com");

        assertThat(response.getChartId()).isEqualTo("my-tickers");
        assertThat((List<?>) response.getData()).hasSize(1);
    }

    @Test
    void getGeneralMarketSentiment_ShouldReturnChartData() {
        when(articleRepository.findByProcessedAtBetween(any(OffsetDateTime.class), any(OffsetDateTime.class)))
                .thenReturn(List.of(article));

        ChartDataResponse response = chartService.getGeneralMarketSentiment(Map.of("range", "24h"));

        assertThat(response.getChartId()).isEqualTo("general-market-sentiment");
        assertThat((List<?>) response.getData()).hasSize(1);
    }
}
