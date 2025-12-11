package io.eventlane.web

import io.eventlane.application.ports.EventRepository
import io.eventlane.application.service.EventCommandService
import io.eventlane.application.service.ImageStorageService
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
import java.time.Instant

@RestController
@RequestMapping("/api/events")
class EventsController(
    private val repository: EventRepository,
    private val commands: EventCommandService,
    private val imageService: ImageStorageService,
) {
    @GetMapping
    fun listManagedEvents(@AuthenticationPrincipal user: SecurityUser?): List<EventResponseDto> {
        val userEmail = user?.email ?: return emptyList()

        return repository.findByAdmin(userEmail)
            .map { DtoMapper.toEventResponse(it, userEmail, imageService) }
    }

    @PostMapping
    fun createEvent(
        @RequestBody request: CreateEventRequestDto,
        @AuthenticationPrincipal user: SecurityUser,
    ): EventResponseDto {
        val delta = commands.createEvent(
            title = request.title,
            capacity = request.capacity,
            eventDate = Instant.parse(request.eventDate),
            timezone = request.timezone,
            creatorEmail = user.email,
        )

        val event = repository.findBySlug(delta.eventSlug)
        return DtoMapper.toEventResponse(event, user.email, imageService)
    }

    @GetMapping("/{slug}")
    fun getEvent(@PathVariable slug: String, @AuthenticationPrincipal user: SecurityUser?): EventResponseDto {
        val event = repository.findBySlug(slug)
        val userEmail = user?.email ?: ""
        return DtoMapper.toEventResponse(event, userEmail, imageService)
    }
}
