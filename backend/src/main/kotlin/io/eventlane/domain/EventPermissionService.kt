package io.eventlane.domain

import io.eventlane.persistence.EventRepository
import org.springframework.stereotype.Service

@Service
class EventPermissionService(
    private val eventRepository: EventRepository,
) {
    fun requireAdmin(slug: String, userEmail: String) {
        val event = eventRepository.findBySlug(slug)
            ?: throw NotFoundException("Event not found: $slug")
        val isAdmin = event.admins.any { it.equals(userEmail.lowercase(), ignoreCase = true) }
        if (!isAdmin) {
            throw ForbiddenException("Not an admin for this event: $slug")
        }
    }

    fun isAdmin(slug: String, userEmail: String): Boolean {
        val event = eventRepository.findBySlug(slug) ?: return false
        return event.admins.any { it.equals(userEmail.lowercase(), ignoreCase = true) }
    }
}
