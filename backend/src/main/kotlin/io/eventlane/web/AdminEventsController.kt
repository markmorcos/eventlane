package io.eventlane.web

import io.eventlane.application.ports.EventRepository
import io.eventlane.application.service.EventCommandService
import io.eventlane.auth.SecurityUser
import io.eventlane.domain.model.EventDelta
import io.eventlane.domain.model.ForbiddenException
import io.eventlane.web.dto.UpdateCapacityRequestDto
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/events/{slug}")
class AdminEventsController(
    private val repository: EventRepository,
    private val commands: EventCommandService,
) {
    private fun ensureAdmin(slug: String, userEmail: String) {
        val event = repository.findBySlug(slug)
        if (!event.isAdmin(userEmail.lowercase())) {
            throw ForbiddenException("Only admins can perform this action.")
        }
    }

    @PostMapping("/capacity")
    fun updateCapacity(
        @PathVariable slug: String,
        @RequestBody body: UpdateCapacityRequestDto,
        @AuthenticationPrincipal user: SecurityUser,
    ): List<EventDelta> {
        ensureAdmin(slug, user.email)
        return commands.updateCapacity(slug, body.capacity)
    }

    @DeleteMapping
    fun deleteEvent(@PathVariable slug: String, @AuthenticationPrincipal user: SecurityUser): EventDelta {
        ensureAdmin(slug, user.email)
        return commands.deleteEvent(slug)
    }

    @PostMapping("/admins/{email}")
    fun addAdmin(
        @PathVariable slug: String,
        @PathVariable email: String,
        @AuthenticationPrincipal user: SecurityUser,
    ): List<EventDelta> {
        ensureAdmin(slug, user.email)
        return commands.addAdmin(slug, email)
    }

    @DeleteMapping("/admins/{email}")
    fun removeAdmin(
        @PathVariable slug: String,
        @PathVariable email: String,
        @AuthenticationPrincipal user: SecurityUser,
    ): List<EventDelta> {
        ensureAdmin(slug, user.email)
        return commands.removeAdmin(slug, email)
    }
}
