package org.finsight.coreapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class NlpChatResponseDto {
    private String answer;

    @JsonProperty("source_urls")
    private List<String> sourceUrls;
}
