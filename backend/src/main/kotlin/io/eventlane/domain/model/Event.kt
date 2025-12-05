package io.eventlane.domain.model

import java.time.Instant

data class Event(
    val id: String? = null,
    val slug: String,
    val title: String,
    val capacity: Int,

    val confirmedList: List<Attendee>,
    val waitingList: List<Attendee>,

    val creatorEmail: String,
    val admins: List<String>,

    val createdAt: Instant,
    val updatedAt: Instant,

    val version: Long? = null,
) {
    fun isAdmin(email: String) = email == creatorEmail || admins.contains(email)

    fun hasCapacity(): Boolean = confirmedList.size < capacity

    fun findAttendeeByEmail(email: String): Attendee? = confirmedList.find { it.email == email }
        ?: waitingList.find { it.email == email }

    fun addAttendee(attendee: Attendee): Pair<Event, AttendeeStatus> {
        return if (hasCapacity()) {
            val updated = this.copy(
                confirmedList = confirmedList + attendee,
                updatedAt = Instant.now(),
            )
            updated to AttendeeStatus.CONFIRMED
        } else {
            val updated = this.copy(
                waitingList = waitingList + attendee,
                updatedAt = Instant.now(),
            )
            updated to AttendeeStatus.WAITLISTED
        }
    }

    fun removeAttendee(attendee: Attendee): Pair<Event, Attendee?> {
        val now = Instant.now()

        val wasConfirmed = confirmedList.any { it.email == attendee.email }
        val wasWaitlisted = waitingList.any { it.email == attendee.email }

        if (!wasConfirmed && !wasWaitlisted) {
            return this to null
        }

        var updatedEvent = this.copy(
            confirmedList = confirmedList.filter { it.email != attendee.email },
            waitingList = waitingList.filter { it.email != attendee.email },
            updatedAt = now,
        )

        var promoted: Attendee? = null

        if (wasConfirmed && updatedEvent.hasCapacity() && updatedEvent.waitingList.isNotEmpty()) {
            promoted = updatedEvent.waitingList.first()

            updatedEvent = updatedEvent.copy(
                confirmedList = updatedEvent.confirmedList + promoted,
                waitingList = updatedEvent.waitingList.drop(1),
                updatedAt = now,
            )
        }

        return updatedEvent to promoted
    }
}
