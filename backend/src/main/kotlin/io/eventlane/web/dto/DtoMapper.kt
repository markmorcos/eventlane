package io.eventlane.web.dto

import io.eventlane.domain.model.Attendee
import io.eventlane.domain.model.AttendeeStatus
import io.eventlane.domain.model.Event

object DtoMapper {
    fun toAttendeeDto(a: Attendee): AttendeeDto = AttendeeDto(
        email = a.email,
        name = a.name,
        createdAt = a.createdAt.toString(),
    )

    fun toEventResponse(event: Event, requesterEmail: String): EventResponseDto {
        val isAdmin = event.isAdmin(requesterEmail.lowercase())
        val status = when {
            event.confirmedList.any { it.email == requesterEmail.lowercase() } -> AttendeeStatus.CONFIRMED
            event.waitingList.any { it.email == requesterEmail.lowercase() } -> AttendeeStatus.WAITLISTED
            else -> null
        }

        return EventResponseDto(
            slug = event.slug,
            title = event.title,
            capacity = event.capacity,
            confirmedCount = event.confirmedList.size,
            waitlistedCount = event.waitingList.size,
            creatorEmail = event.creatorEmail,
            isAdmin = isAdmin,
            requesterStatus = status,

            confirmed = if (isAdmin) event.confirmedList.map { toAttendeeDto(it) } else null,
            waitlisted = if (isAdmin) event.waitingList.map { toAttendeeDto(it) } else null,
            admins = if (isAdmin) event.admins else null,

            createdAt = event.createdAt.toEpochMilli(),
            version = event.version ?: 0L,
        )
    }
}
