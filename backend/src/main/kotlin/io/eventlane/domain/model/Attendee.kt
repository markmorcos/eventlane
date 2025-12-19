package io.eventlane.domain.model

import java.time.Instant

data class Attendee(
    val name: String,
    val email: String,
    val status: AttendeeStatus,
    val joinedAt: Instant = Instant.now(),
    val language: String = "en",
)

enum class AttendeeStatus {
    CONFIRMED,
    WAITLISTED,
    BLOCKED,
}
