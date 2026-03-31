package org.finsight.coreapi.user;

import java.util.List;

public record UserSettingsDto(List<String> tickers) {
}
