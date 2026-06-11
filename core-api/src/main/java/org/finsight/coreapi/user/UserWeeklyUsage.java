package org.finsight.coreapi.user;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_weekly_usage", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "week_start_date"})
})
public class UserWeeklyUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "week_start_date", nullable = false)
    private LocalDate weekStartDate;

    @Column(name = "rag_query_count", nullable = false)
    @Builder.Default
    private Integer ragQueryCount = 0;

    @Column(name = "ingestion_count", nullable = false)
    @Builder.Default
    private Integer ingestionCount = 0;
}
