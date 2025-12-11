package io.eventlane.persistence.document

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("events")
data class EventDocument(
    @Id val id: String? = null,

    @Indexed(unique = true) val slug: String,

    val title: String,
    val capacity: Int,

    val creatorEmail: String,
    val admins: List<String>,

    val confirmedList: List<AttendeeDocument>,
    val waitingList: List<AttendeeDocument>,

    val createdAt: Instant,
    val updatedAt: Instant,

    @Version val version: Long? = null,
)

data class AttendeeDocument(
    val name: String,
    val email: String,
    val createdAt: Instant,
)
