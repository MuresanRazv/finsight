package org.finsight.coreapi.rss;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "rss_sources")
public class RssSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String url;

    @Builder.Default
    @Column(name = "is_enabled")
    private Boolean isEnabled = true;

    @Builder.Default
    @Column(name = "item_selector", length = 50)
    private String itemSelector = "item";

    @Builder.Default
    @Column(name = "title_selector", length = 50)
    private String titleSelector = "title";

    @Builder.Default
    @Column(name = "link_selector", length = 50)
    private String linkSelector = "link";

    @Column(name = "link_attribute", length = 50)
    private String linkAttribute;

    @Builder.Default
    @Column(name = "description_selector", length = 50)
    private String descriptionSelector = "description";

    @Builder.Default
    @Column(name = "pub_date_selector", length = 50)
    private String pubDateSelector = "pubDate";

    @Column(name = "pub_date_format", length = 100)
    private String pubDateFormat;

    @Builder.Default
    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
