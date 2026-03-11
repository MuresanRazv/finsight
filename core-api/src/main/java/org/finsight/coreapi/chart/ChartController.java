package org.finsight.coreapi.chart;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/charts")
@RequiredArgsConstructor
public class ChartController {

    private final ChartService chartService;

    @GetMapping("/latest-articles")
    public ChartDataResponse getLatestArticles(@RequestParam Map<String, String> filters) {
        return chartService.getLatestArticles(filters);
    }

    @GetMapping("/popular-tickers")
    public ChartDataResponse getPopularTickers(@RequestParam Map<String, String> filters) {
        return chartService.getPopularTickers(filters);
    }

    @GetMapping("/my-tickers")
    public ChartDataResponse getMyTickers(
            @RequestParam Map<String, String> filters,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return chartService.getMyTickers(filters, userDetails.getUsername());
    }

    @GetMapping("/general-market-sentiment")
    public ChartDataResponse getGeneralMarketSentiment(@RequestParam Map<String, String> filters) {
        return chartService.getGeneralMarketSentiment(filters);
    }
}
