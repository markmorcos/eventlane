package io.eventlane.domain.model

import java.time.Instant

data class Event(
    val id: String? = null,
    val slug: String,
    val capacity: Int,

    val eventDate: Instant,
    val timezone: String,
    val location: Location? = null,
    val description: String? = null,
    val coverImageUrl: String? = null,

    val attendees: List<Attendee>,

    val seriesId: String, // Required - every event belongs to a series
    val deletedAt: Instant? = null,

    val createdAt: Instant,
    val updatedAt: Instant,

    val version: Long? = null,
) {

    val confirmedList: List<Attendee>
        get() = attendees.filter { it.status == AttendeeStatus.CONFIRMED }

    val waitingList: List<Attendee>
        get() = attendees.filter { it.status == AttendeeStatus.WAITLISTED }

    fun hasCapacity(): Boolean = confirmedList.size < capacity

    fun findAttendeeByEmail(email: String): Attendee? = attendees.find { it.email.equals(email, ignoreCase = true) }

    fun addAttendee(attendee: Attendee): Pair<Event, AttendeeStatus> {
        val status = if (hasCapacity()) AttendeeStatus.CONFIRMED else AttendeeStatus.WAITLISTED
        val newAttendee = attendee.copy(status = status)
        return this.copy(
            attendees = attendees + newAttendee,
            updatedAt = Instant.now(),
        ) to status
    }

    fun removeAttendee(attendee: Attendee): Pair<Event, Attendee?> {
        val now = Instant.now()
        val existing = findAttendeeByEmail(attendee.email) ?: return this to null

        val wasConfirmed = existing.status == AttendeeStatus.CONFIRMED
        var updatedAttendees = attendees.filter { it.email != attendee.email }

        var promoted: Attendee? = null

        if (wasConfirmed) {
            val nextWaitlisted = updatedAttendees
                .filter { it.status == AttendeeStatus.WAITLISTED }
                .minByOrNull { it.joinedAt }

            if (nextWaitlisted != null && updatedAttendees.count { it.status == AttendeeStatus.CONFIRMED } < capacity) {
                promoted = nextWaitlisted.copy(status = AttendeeStatus.CONFIRMED)
                updatedAttendees = updatedAttendees.map {
                    if (it.email == nextWaitlisted.email) promoted else it
                }
            }
        }

        return this.copy(
            attendees = updatedAttendees,
            updatedAt = now,
        ) to promoted
    }
}
