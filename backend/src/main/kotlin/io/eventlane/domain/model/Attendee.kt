package io.eventlane.domain.model

import java.time.Instant
import java.util.UUID

data class Attendee(
    val id: String = UUID.randomUUID().toString(),
    val userId: String,
    val name: String,
    val email: String,
    val createdAt: Instant = Instant.now(),
)

enum class AttendeeStatus {
    CONFIRMED,
    WAITLISTED,
    BLOCKED,
}
