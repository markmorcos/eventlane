package io.eventlane.domain.model

import java.time.Instant

data class Attendee(
    val name: String,
    val email: String,
    val createdAt: Instant = Instant.now(),
)

enum class AttendeeStatus {
    CONFIRMED,
    WAITLISTED,
    BLOCKED,
}
