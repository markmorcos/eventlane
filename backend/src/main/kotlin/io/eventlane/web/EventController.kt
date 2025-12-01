package io.eventlane.web

import io.eventlane.auth.SecurityUser
import io.eventlane.domain.EventPermissionService
import io.eventlane.domain.EventService
import io.eventlane.web.dto.AttendeesDTO
import io.eventlane.web.dto.DtoMapper
import io.eventlane.web.dto.EventDetailDTO
import io.eventlane.web.dto.EventSummaryDTO
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/events")
class EventController(
    private val eventService: EventService,
    private val eventPermissionService: EventPermissionService
) {
    
    @GetMapping
    fun getAllEvents(
        @AuthenticationPrincipal user: SecurityUser?
    ): List<EventSummaryDTO> {
        val events = eventService.getAllEvents()
        return events.map { event ->
            val isAdmin = user?.let { 
                eventPermissionService.isAdmin(event.slug, it.email) 
            } ?: false
            DtoMapper.toEventSummaryDTO(event, isAdmin)
        }
    }
    
    @GetMapping("/{slug}")
    fun getEvent(
        @PathVariable slug: String,
        @AuthenticationPrincipal user: SecurityUser?
    ): EventDetailDTO {
        val event = eventService.getEventBySlug(slug)
        val isAdmin = user?.let { 
            eventPermissionService.isAdmin(slug, it.email) 
        } ?: false
        return DtoMapper.toEventDetailDTO(event, isAdmin, user?.uid)
    }
    
    @GetMapping("/{slug}/attendees")
    fun getAttendees(
        @PathVariable slug: String,
        @AuthenticationPrincipal user: SecurityUser
    ): AttendeesDTO {
        // Only admins can view full attendee list
        eventPermissionService.requireAdmin(slug, user.email)
        val event = eventService.getEventBySlug(slug)
        return DtoMapper.toAttendeesDTO(event)
    }
}
