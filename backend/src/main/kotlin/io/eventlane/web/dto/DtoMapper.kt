package io.eventlane.web.dto

import io.eventlane.domain.model.Attendee
import io.eventlane.domain.model.Event

object DtoMapper {
    fun toAttendeeDto(a: Attendee): AttendeeDto = AttendeeDto(
        email = a.email,
        name = a.name,
        userId = a.userId,
    )

    fun toEventResponse(event: Event, requesterEmail: String): EventResponseDto {
        val isAdmin = event.isAdmin(requesterEmail.lowercase())

        return EventResponseDto(
            slug = event.slug,
            title = event.title,
            capacity = event.capacity,
            confirmedCount = event.confirmedList.size,
            waitlistCount = event.waitingList.size,
            isAdmin = isAdmin,

            confirmed = if (isAdmin) event.confirmedList.map { toAttendeeDto(it) } else null,
            waitlist = if (isAdmin) event.waitingList.map { toAttendeeDto(it) } else null,
            admins = if (isAdmin) event.admins else null,
        )
    }
}
