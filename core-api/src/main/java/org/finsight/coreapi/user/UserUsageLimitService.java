package org.finsight.coreapi.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

@Service
@RequiredArgsConstructor
public class UserUsageLimitService {

    private final UserWeeklyUsageRepository usageRepository;

    private static final int MAX_RAG_QUERIES = 20;
    private static final int MAX_INGESTIONS = 50;

    public LocalDate getCurrentWeekStartDate() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    @Transactional
    public void checkAndIncrementRagQuery(User user) {
        if (Role.ADMIN.equals(user.getRole())) {
            return;
        }

        LocalDate weekStart = getCurrentWeekStartDate();
        UserWeeklyUsage usage = usageRepository.findByUserIdAndWeekStartDateForUpdate(user.getId(), weekStart)
                .orElseGet(() -> {
                    UserWeeklyUsage newUsage = UserWeeklyUsage.builder()
                            .user(user)
                            .weekStartDate(weekStart)
                            .ragQueryCount(0)
                            .ingestionCount(0)
                            .build();
                    return usageRepository.save(newUsage);
                });

        if (usage.getRagQueryCount() >= MAX_RAG_QUERIES) {
            throw new UsageLimitExceededException("Weekly RAG query limit exceeded (" + MAX_RAG_QUERIES + " queries allowed for your tier).");
        }

        usage.setRagQueryCount(usage.getRagQueryCount() + 1);
        usageRepository.save(usage);
    }

    @Transactional
    public void checkAndIncrementIngestion(User user, int incrementCount) {
        if (Role.ADMIN.equals(user.getRole())) {
            return;
        }

        LocalDate weekStart = getCurrentWeekStartDate();
        UserWeeklyUsage usage = usageRepository.findByUserIdAndWeekStartDateForUpdate(user.getId(), weekStart)
                .orElseGet(() -> {
                    UserWeeklyUsage newUsage = UserWeeklyUsage.builder()
                            .user(user)
                            .weekStartDate(weekStart)
                            .ragQueryCount(0)
                            .ingestionCount(0)
                            .build();
                    return usageRepository.save(newUsage);
                });

        int currentCount = usage.getIngestionCount();
        if (currentCount + incrementCount > MAX_INGESTIONS) {
            int remaining = MAX_INGESTIONS - currentCount;
            if (incrementCount > 1) {
                throw new UsageLimitExceededException("Weekly ingestion limit exceeded. You have " 
                        + remaining + " ingestion(s) remaining, but requested to ingest " + incrementCount + " articles.");
            } else {
                throw new UsageLimitExceededException("Weekly ingestion limit exceeded (" + MAX_INGESTIONS + " ingestions allowed for your tier).");
            }
        }

        usage.setIngestionCount(currentCount + incrementCount);
        usageRepository.save(usage);
    }
}
