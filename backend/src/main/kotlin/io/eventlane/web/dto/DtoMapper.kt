package io.eventlane.web.dto

import io.eventlane.persistence.Attendee
import io.eventlane.persistence.EventDocument

object DtoMapper {
    
    fun toAttendeeDTO(attendee: Attendee, status: String): AttendeeDTO {
        return AttendeeDTO(
            id = attendee.id,
            userId = attendee.userId,
            name = attendee.name,
            email = attendee.email,
            status = status,
            createdAt = attendee.createdAt.toEpochMilli()
        )
    }
    
    fun toEventSummaryDTO(event: EventDocument): EventSummaryDTO {
        val confirmedCount = event.confirmedList.size
        val waitlistCount = event.waitingList.size
        
        return EventSummaryDTO(
            id = event.id ?: "",
            slug = event.slug,
            title = event.title,
            capacity = event.capacity,
            confirmedCount = confirmedCount,
            waitlistCount = waitlistCount,
            createdAt = event.createdAt.toEpochMilli()
        )
    }
    
    fun toEventDetailDTO(event: EventDocument, isAdmin: Boolean, email: String? = null): EventDetailDTO {
        val confirmedCount = event.confirmedList.size
        val waitlistCount = event.waitingList.size
        
        val currentUserAttendee = email?.let { userEmail ->
            event.confirmedList.find { it.email == userEmail }?.let { toAttendeeDTO(it, "CONFIRMED") }
                ?: event.waitingList.find { it.email == userEmail }?.let { toAttendeeDTO(it, "WAITLISTED") }
        }
        
        return EventDetailDTO(
            id = event.id ?: "",
            slug = event.slug,
            title = event.title,
            capacity = event.capacity,
            confirmedCount = confirmedCount,
            waitlistCount = waitlistCount,
            isAdmin = isAdmin,
            currentUserAttendee = currentUserAttendee,
            createdAt = event.createdAt.toEpochMilli(),
            updatedAt = event.updatedAt.toEpochMilli()
        )
    }
    
    fun toAttendeesDTO(event: EventDocument): AttendeesDTO {
        val confirmed = event.confirmedList
            .sortedBy { it.createdAt }
            .map { toAttendeeDTO(it, "CONFIRMED") }
        
        val waitlisted = event.waitingList
            .sortedBy { it.createdAt }
            .map { toAttendeeDTO(it, "WAITLISTED") }
        
        return AttendeesDTO(confirmed, waitlisted)
    }

    fun toAdminsDTO(event: EventDocument): List<String> {
        return event.admins
    }
}
