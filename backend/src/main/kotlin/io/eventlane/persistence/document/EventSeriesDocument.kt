package io.eventlane.persistence.document

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("event_series")
data class EventSeriesDocument(
    @Id val id: String? = null,

    @Indexed(unique = true) val slug: String,

    val title: String,
    val interval: String? = null,
    val leadWeeks: Int = 0,
    val autoGenerate: Boolean = false,
    val anchorDate: Instant,
    val endDate: Instant? = null,

    val creatorEmail: String,
    val admins: List<String>,

    val createdAt: Instant,
    val updatedAt: Instant,

    @Version val version: Long? = null,
)
