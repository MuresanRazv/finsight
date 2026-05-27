package org.finsight.coreapi.article;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GraphExportServiceTest {

    @Mock
    private ArticleRepository articleRepository;

    @InjectMocks
    private GraphExportService graphExportService;

    private Article article;

    @BeforeEach
    void setUp() {
        EntitySentiment entitySentiment = EntitySentiment.builder()
                .ticker("AAPL")
                .name("Apple Inc.")
                .sentimentScore(0.8)
                .build();

        article = Article.builder()
                .url("http://example.com")
                .processedAt(OffsetDateTime.now())
                .entities(List.of(entitySentiment))
                .build();
    }

    @Test
    void exportTurtle_ShouldWriteCorrectRdf() {
        when(articleRepository.findAllWithEntities()).thenReturn(List.of(article));

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);

        graphExportService.exportTurtle(printWriter);

        String output = stringWriter.toString();
        assertThat(output).contains("@prefix fs: <http://finsight.org/ontology/> .");
        assertThat(output).contains("<http://example.com> rdf:type fs:Article .");
        assertThat(output).contains("fs:ticker_AAPL rdf:type fs:Company ;");
        assertThat(output).contains("fs:hasName \"Apple Inc.\" .");
    }
}
