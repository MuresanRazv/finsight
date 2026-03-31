package org.finsight.coreapi.controller;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.finsight.coreapi.service.GraphExportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/export/graph")
@RequiredArgsConstructor
public class GraphExportController {

    private final GraphExportService graphExportService;

    @GetMapping("/ttl")
    public void exportTtl(HttpServletResponse response) throws IOException {
        response.setContentType("text/turtle");
        response.setHeader("Content-Disposition", "attachment; filename=\"finsight_knowledge_graph.ttl\"");
        
        graphExportService.exportTurtle(response.getWriter());
    }
}
