package org.finsight.coreapi.chart;

import lombok.RequiredArgsConstructor;
import org.finsight.coreapi.domain.Article;
import org.finsight.coreapi.domain.EntitySentiment;
import org.finsight.coreapi.dto.UserSettingsDto;
import org.finsight.coreapi.repository.ArticleRepository;
import org.finsight.coreapi.repository.EntitySentimentRepository;
import org.finsight.coreapi.service.UserSettingsService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChartService {

    private final ArticleRepository articleRepository;
    private final EntitySentimentRepository entitySentimentRepository;
    private final UserSettingsService userSettingsService;

    public ChartDataResponse getLatestArticles(Map<String, String> filters) {
        int limit = Integer.parseInt(filters.getOrDefault("limit", "10"));
        
        List<Article> articles = articleRepository.findAll(
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "processedAt"))
        ).getContent();

        List<Map<String, Object>> data = articles.stream().map(article -> {
            Map<String, Object> map = new HashMap<>();
            map.put("url", article.getUrl());
            map.put("processed_at", article.getProcessedAt());
            map.put("overall_sentiment_score", article.getOverallSentimentScore());
            map.put("overall_sentiment_label", article.getOverallSentimentLabel());
            map.put("entities", article.getEntities().stream().map(e -> {
                Map<String, Object> entityMap = new HashMap<>();
                entityMap.put("ticker", e.getTicker());
                entityMap.put("sentiment_score", e.getSentimentScore());
                return entityMap;
            }).collect(Collectors.toList()));
            return map;
        }).collect(Collectors.toList());

        return ChartDataResponse.builder()
                .chartId("latest-articles")
                .title("Latest Fetched Articles")
                .description("Recent articles and their sentiment analysis")
                .availableFilters(List.of(
                        FilterDefinition.builder()
                                .key("limit")
                                .label("Number of Articles")
                                .type(FilterType.SELECT)
                                .options(List.of("5", "10", "20", "50"))
                                .defaultValue("10")
                                .build()
                ))
                .data(data)
                .build();
    }

    public ChartDataResponse getPopularTickers(Map<String, String> filters) {
        // Default to last 24 hours if not specified
        OffsetDateTime since = OffsetDateTime.now().minusHours(24);
        
        List<EntitySentiment> sentiments = entitySentimentRepository.findByProcessedAtAfter(since);

        Map<String, List<EntitySentiment>> groupedByTicker = sentiments.stream()
                .filter(s -> s.getTicker() != null)
                .collect(Collectors.groupingBy(EntitySentiment::getTicker));

        List<Map<String, Object>> data = groupedByTicker.entrySet().stream()
                .map(entry -> {
                    String ticker = entry.getKey();
                    List<EntitySentiment> tickerSentiments = entry.getValue();
                    double avgScore = tickerSentiments.stream()
                            .mapToDouble(EntitySentiment::getSentimentScore)
                            .average()
                            .orElse(0.0);
                    
                    Map<String, Object> map = new HashMap<>();
                    map.put("ticker", ticker);
                    map.put("count", tickerSentiments.size());
                    map.put("average_sentiment", avgScore);
                    return map;
                })
                .sorted((a, b) -> Integer.compare((Integer) b.get("count"), (Integer) a.get("count")))
                .limit(10)
                .collect(Collectors.toList());

        return ChartDataResponse.builder()
                .chartId("popular-tickers")
                .title("Popular Tickers (Last 24h)")
                .description("Tickers with the most mentions in the last 24 hours")
                .availableFilters(List.of()) // No filters for now, but easy to add time range
                .data(data)
                .build();
    }

    public ChartDataResponse getMyTickers(Map<String, String> filters, String userEmail) {
        UserSettingsDto settings = userSettingsService.getUserSettings(userEmail);
        List<String> userTickers = settings.tickers() != null ? settings.tickers() : List.of();

        if (userTickers.isEmpty()) {
            return ChartDataResponse.builder()
                    .chartId("my-tickers")
                    .title("My Tickers Sentiment")
                    .description("Track tickers in settings to see their sentiment trend.")
                    .availableFilters(List.of())
                    .data(List.of())
                    .build();
        }

        String ticker = filters.getOrDefault("ticker", userTickers.get(0));
        // Ensure the requested ticker is in the user's list
        if (!userTickers.contains(ticker)) {
            ticker = userTickers.get(0);
        }

        String range = filters.getOrDefault("range", "24h");
        OffsetDateTime since;
        switch (range) {
            case "7d":
                since = OffsetDateTime.now().minusDays(7);
                break;
            case "30d":
                since = OffsetDateTime.now().minusDays(30);
                break;
            default:
                since = OffsetDateTime.now().minusHours(24);
                break;
        }

        List<EntitySentiment> sentiments = entitySentimentRepository.findByTickerAndProcessedAtAfter(ticker, since);

        List<Map<String, Object>> timeSeries = sentiments.stream()
                .sorted(Comparator.comparing(EntitySentiment::getProcessedAt))
                .map(s -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("date", s.getProcessedAt());
                    point.put("sentiment", s.getSentimentScore());
                    return point;
                })
                .collect(Collectors.toList());

        return ChartDataResponse.builder()
                .chartId("my-tickers")
                .title("My Tickers Sentiment: " + ticker)
                .description("Sentiment trend for " + ticker + " over the last " + range)
                .availableFilters(List.of(
                        FilterDefinition.builder()
                                .key("ticker")
                                .label("Ticker Symbol")
                                .type(FilterType.SELECT)
                                .options(userTickers)
                                .defaultValue(userTickers.get(0))
                                .build(),
                        FilterDefinition.builder()
                                .key("range")
                                .label("Time Range")
                                .type(FilterType.SELECT)
                                .options(List.of("24h", "7d", "30d"))
                                .defaultValue("24h")
                                .build()
                ))
                .data(timeSeries)
                .build();
    }
}
