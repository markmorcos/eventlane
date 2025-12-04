package io.eventlane.domain

import io.eventlane.persistence.EventDocument
import io.eventlane.persistence.EventRepository
import org.springframework.stereotype.Service

@Service
class EventService(
    private val eventRepository: EventRepository,
) {
    fun getEventsByAdmin(adminEmail: String): List<EventDocument> {
        return eventRepository.findByAdminsContaining(adminEmail)
    }

    fun getEventBySlug(slug: String): EventDocument {
        return eventRepository.findBySlug(slug)
            ?: throw NotFoundException("Event not found: $slug")
    }

    fun getConfirmedCount(event: EventDocument): Int {
        return event.confirmedList.size
    }

    fun getWaitlistCount(event: EventDocument): Int {
        return event.waitingList.size
    }
}
