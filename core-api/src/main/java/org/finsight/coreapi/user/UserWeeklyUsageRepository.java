package org.finsight.coreapi.user;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface UserWeeklyUsageRepository extends JpaRepository<UserWeeklyUsage, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM UserWeeklyUsage u WHERE u.user.id = :userId AND u.weekStartDate = :weekStartDate")
    Optional<UserWeeklyUsage> findByUserIdAndWeekStartDateForUpdate(
            @Param("userId") Integer userId,
            @Param("weekStartDate") LocalDate weekStartDate
    );
}
