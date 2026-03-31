package org.finsight.coreapi.chat;

import jakarta.validation.constraints.NotBlank;

public record ChatRequestDto(
        @NotBlank(message = "Query cannot be blank")
        String query
) {}
