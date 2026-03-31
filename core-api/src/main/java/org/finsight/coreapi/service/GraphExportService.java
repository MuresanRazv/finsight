package org.finsight.coreapi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.finsight.coreapi.domain.Article;
import org.finsight.coreapi.domain.EntitySentiment;
import org.finsight.coreapi.repository.ArticleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class GraphExportService {

    private final ArticleRepository articleRepository;

    @Transactional(readOnly = true)
    public void exportTurtle(PrintWriter writer) {
        // 1. Write Prefixes
        writer.println("@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .");
        writer.println("@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .");
        writer.println("@prefix fs: <http://finsight.org/ontology/> .");
        writer.println();

        // 2. Fetch Data
        List<Article> articles = articleRepository.findAllWithEntities();
        Set<String> processedTickers = new HashSet<>();

        // 3. Iterate through articles
        for (Article article : articles) {
            String sanitizedUrl = sanitizeIri(article.getUrl());
            writer.printf("<%s> rdf:type fs:Article .%n", sanitizedUrl);

            for (EntitySentiment entity : article.getEntities()) {
                if (entity.getTicker() == null) continue;

                String ticker = entity.getTicker();
                String mentionId = String.format("mention_%x_%x", 
                    article.getUrl().hashCode(), 
                    ticker.hashCode());

                // Article -> Mention
                writer.printf("<%s> fs:hasMention _:%s .%n", sanitizedUrl, mentionId);

                // Mention properties
                writer.printf("_:%s rdf:type fs:SentimentMention ;%n", mentionId);
                writer.printf("    fs:mentionsEntity fs:ticker_%s ;%n", ticker);
                writer.printf("    fs:sentimentScore \"%.4f\"^^xsd:decimal .%n", entity.getSentimentScore());

                // Define Company once
                if (!processedTickers.contains(ticker)) {
                    writer.printf("fs:ticker_%s rdf:type fs:Company ;%n", ticker);
                    writer.printf("    fs:hasName \"%s\" .%n", escapeLiteral(entity.getName()));
                    processedTickers.add(ticker);
                }
            }
            writer.println();
        }
        writer.flush();
    }

    private String sanitizeIri(String url) {
        if (url == null) return "";
        return url.replace(" ", "%20").replace("<", "%3C").replace(">", "%3E").replace("\"", "%22");
    }

    private String escapeLiteral(String literal) {
        if (literal == null) return "";
        return literal.replace("\\", "\\\\")
                      .replace("\"", "\\\"")
                      .replace("\n", "\\n")
                      .replace("\r", "\\r");
    }
}
