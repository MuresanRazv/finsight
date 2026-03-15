package org.finsight.coreapi.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequestDto(
        @NotBlank(message = "Query cannot be blank")
        String query
) {}
