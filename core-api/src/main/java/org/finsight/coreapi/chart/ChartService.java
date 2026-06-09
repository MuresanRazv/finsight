package org.finsight.coreapi.chart;

import lombok.RequiredArgsConstructor;
import org.finsight.coreapi.article.Article;
import org.finsight.coreapi.article.EntitySentiment;
import org.finsight.coreapi.user.UserSettingsDto;
import org.finsight.coreapi.article.ArticleRepository;
import org.finsight.coreapi.article.EntitySentimentRepository;
import org.finsight.coreapi.user.UserSettingsService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
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
            map.put("title", article.getTitle());
            map.put("source", article.getSource());
            map.put("processed_at", article.getProcessedAt());
            map.put("overall_sentiment_score", article.getOverallSentimentScore());
            map.put("overall_sentiment_label", article.getOverallSentimentLabel());
            map.put("entities", article.getEntities().stream().map(e -> {
                Map<String, Object> entityMap = new HashMap<>();
                entityMap.put("ticker", e.getTicker());
                entityMap.put("sentiment_score", e.getSentimentScore());
                entityMap.put("name", e.getName());
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
                .availableFilters(List.of()) 
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

        String tickerFilter = filters.getOrDefault("ticker", "");

        String range = filters.getOrDefault("range", "24h");
        OffsetDateTime since = switch (range) {
            case "7d" -> OffsetDateTime.now().minusDays(7);
            case "30d" -> OffsetDateTime.now().minusDays(30);
            default -> OffsetDateTime.now().minusHours(24);
        };

        List<String> targetTickers = !tickerFilter.isEmpty() ? List.of(tickerFilter) : List.of(userTickers.getFirst());
        List<EntitySentiment> sentiments = entitySentimentRepository.findByTickerInAndProcessedAtAfter(targetTickers, since);

        Map<OffsetDateTime, Map<String, Object>> groupedData = new TreeMap<>();

        for (EntitySentiment s : sentiments) {
            OffsetDateTime time = s.getProcessedAt();
            groupedData.putIfAbsent(time, new HashMap<>());
            Map<String, Object> point = groupedData.get(time);
            point.put("date", time);

            double confidence = s.getSentimentScore();
            String label = s.getSentimentLabel() != null ? s.getSentimentLabel().toLowerCase() : "neutral";

            // Map the sentiment into a -1 to 1 scale for the chart, so negative sentiment renders below zero
            // and we can use a fixed gradient.
            double plotValue = confidence;
            if ("negative".equals(label)) {
                plotValue = -confidence;
            } else if ("neutral".equals(label)) {
                plotValue = 0; // Neutral is at 0
            }

            String ticker = s.getTicker();
            point.put(ticker, plotValue);
            point.put(ticker + "_label", label);
            point.put(ticker + "_confidence", confidence);
        }

        List<Map<String, Object>> timeSeries = new ArrayList<>(groupedData.values());

        return ChartDataResponse.builder()
                .chartId("my-tickers")
                .title("My Tickers Sentiment: " + tickerFilter)
                .description("Sentiment trend for " + tickerFilter + " over the last " + range)
                .availableFilters(List.of(
                        FilterDefinition.builder()
                                .key("ticker")
                                .label("Ticker Symbol")
                                .type(FilterType.SELECT)
                                .options(userTickers)
                                .defaultValue("")
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

    public ChartDataResponse getGeneralMarketSentiment(Map<String, String> filters) {
        String range = filters.getOrDefault("range", "24h");
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime start;
        ChronoUnit groupingUnit = switch (range) {
            case "7d" -> {
                start = now.minusDays(7);
                yield ChronoUnit.DAYS;
            }
            case "30d" -> {
                start = now.minusDays(30);
                yield ChronoUnit.DAYS;
            }
            default -> {
                start = now.minusHours(24);
                yield ChronoUnit.HOURS;
            }
        };

        List<Article> articles = articleRepository.findByProcessedAtBetween(start, now);

        // Group articles by time unit (hour or day) and calculate average sentiment
        // Here we also need to map to -1 to 1 based on label to have a coherent chart
        Map<OffsetDateTime, Double> aggregatedSentiment = articles.stream()
                .collect(Collectors.groupingBy(
                        article -> article.getProcessedAt().truncatedTo(groupingUnit),
                        Collectors.averagingDouble(article -> {
                            double conf = article.getOverallSentimentScore();
                            String label = article.getOverallSentimentLabel() != null ? article.getOverallSentimentLabel().toLowerCase() : "neutral";
                            if ("negative".equals(label)) return -conf;
                            if ("neutral".equals(label)) return 0.0;
                            return conf;
                        })
                ));

        List<Map<String, Object>> timeSeries = aggregatedSentiment.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("date", entry.getKey());
                    point.put("sentiment", entry.getValue());
                    return point;
                })
                .collect(Collectors.toList());

        return ChartDataResponse.builder()
                .chartId("general-market-sentiment")
                .title("General Market Sentiment")
                .description("Aggregated sentiment of all articles over time")
                .availableFilters(List.of(
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