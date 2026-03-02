package org.finsight.coreapi.dto;

import java.util.List;

public record UserSettingsDto(List<String> tickers) {
}
