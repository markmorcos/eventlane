package io.eventlane.web

import io.eventlane.application.ports.EventRepository
import io.eventlane.application.service.EventCommandService
import io.eventlane.auth.SecurityUser
import io.eventlane.web.dto.CreateEventRequestDto
import io.eventlane.web.dto.DtoMapper
import io.eventlane.web.dto.EventResponseDto
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/events")
class EventsController(
    private val repository: EventRepository,
    private val commands: EventCommandService,
) {
    @GetMapping
    fun listManagedEvents(@AuthenticationPrincipal user: SecurityUser): List<EventResponseDto> {
        return repository.findByAdmin(user.email)
            .map { DtoMapper.toEventResponse(it, user.email) }
    }

    @PostMapping
    fun createEvent(
        @RequestBody request: CreateEventRequestDto,
        @AuthenticationPrincipal user: SecurityUser,
    ): EventResponseDto {
        commands.createEvent(
            slug = request.slug,
            title = request.title,
            capacity = request.capacity,
            creatorEmail = user.email,
        )

        val event = repository.findBySlug(request.slug)
        return DtoMapper.toEventResponse(event, user.email)
    }

    @GetMapping("/{slug}")
    fun getEvent(@PathVariable slug: String, @AuthenticationPrincipal user: SecurityUser?): EventResponseDto {
        val event = repository.findBySlug(slug)
        val userEmail = user?.email ?: ""
        return DtoMapper.toEventResponse(event, userEmail)
    }
}
