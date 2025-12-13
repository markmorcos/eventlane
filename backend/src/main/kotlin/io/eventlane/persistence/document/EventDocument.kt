package io.eventlane.persistence.document

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.CompoundIndex
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("events")
@CompoundIndex(
    name = "slug_active_unique",
    def = "{'slug': 1, 'deletedAt': 1}",
    unique = true,
)
data class EventDocument(
    @Id val id: String? = null,

    val slug: String,

    val capacity: Int,

    val eventDate: Instant,
    val timezone: String,
    val location: LocationDocument? = null,
    val description: String? = null,
    val coverImageUrl: String? = null,

    @Indexed val seriesId: String,
    val deletedAt: Instant? = null,

    val attendees: List<AttendeeDocument>,

    val createdAt: Instant,
    val updatedAt: Instant,

    @Version val version: Long? = null,
)

data class AttendeeDocument(
    val name: String,
    val email: String,
    val status: String,
    val joinedAt: Instant,
)
