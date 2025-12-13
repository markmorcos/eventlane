package io.eventlane.web

import io.eventlane.application.ports.EventRepository
import io.eventlane.application.ports.EventSeriesRepository
import io.eventlane.application.service.EventSeriesCommandService
import io.eventlane.application.service.ImageStorageService
import io.eventlane.auth.SecurityUser
import io.eventlane.web.dto.CreateEventRequestDto
import io.eventlane.web.dto.DtoMapper
import io.eventlane.web.dto.EventOrSeriesGroupDto
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Duration
import java.time.Instant

@RestController
@RequestMapping("/api/events")
class EventsController(
    private val repository: EventRepository,
    private val seriesRepository: EventSeriesRepository,
    private val seriesCommands: EventSeriesCommandService,
    private val imageService: ImageStorageService,
) {
    @GetMapping
    fun listManagedSeries(@AuthenticationPrincipal user: SecurityUser?): List<EventOrSeriesGroupDto> {
        val userEmail = user?.email ?: return emptyList()

        // Find all series where user is creator or admin
        val allSeries = seriesRepository.findByCreatorOrAdmin(userEmail)
        val now = Instant.now()

        return allSeries.mapNotNull { series ->
            val upcomingEvents = repository.findActiveBySeriesId(series.id!!)
                .filter { it.eventDate >= now }
                .sortedBy { it.eventDate }

            if (upcomingEvents.isEmpty()) {
                null
            } else {
                val nextEvent = upcomingEvents.first()
                EventOrSeriesGroupDto(
                    type = if (series.isOneOff()) "standalone" else "series",
                    seriesSlug = series.slug,
                    seriesTitle = series.title,
                    upcomingEventsCount = upcomingEvents.size,
                    nextEvent = DtoMapper.toEventResponse(nextEvent, series, userEmail, imageService),
                )
            }
        }.sortedBy { it.nextEvent.eventDate }
    }

    @PostMapping
    fun createEventOrSeries(
        @RequestBody request: CreateEventRequestDto,
        @AuthenticationPrincipal user: SecurityUser,
    ): EventOrSeriesGroupDto {
        val series = seriesCommands.createSeries(
            title = request.title,
            capacity = request.capacity,
            firstEventDate = Instant.parse(request.eventDate),
            timezone = request.timezone,
            interval = request.interval?.let { Duration.parse(it) },
            leadWeeks = request.leadWeeks ?: 1,
            autoGenerate = request.interval != null,
            endDate = request.endDate?.let { Instant.parse(it) },
            creatorEmail = user.email,
        )

        val event = repository.findActiveBySeriesId(series.id!!).first()

        return EventOrSeriesGroupDto(
            type = if (series.isOneOff()) "standalone" else "series",
            seriesSlug = series.slug,
            seriesTitle = series.title,
            upcomingEventsCount = 1,
            nextEvent = DtoMapper.toEventResponse(event, series, user.email, imageService),
        )
    }

    @GetMapping("/{slug}")
    fun getEvent(@PathVariable slug: String, @AuthenticationPrincipal user: SecurityUser?): EventOrSeriesGroupDto {
        val event = repository.findBySlug(slug)
        val series = seriesRepository.findById(event.seriesId)
        val userEmail = user?.email ?: ""

        val upcomingCount = repository.findActiveBySeriesId(series.id!!)
            .count { it.eventDate >= Instant.now() }

        return EventOrSeriesGroupDto(
            type = if (series.isOneOff()) "standalone" else "series",
            seriesSlug = series.slug,
            seriesTitle = series.title,
            upcomingEventsCount = upcomingCount,
            nextEvent = DtoMapper.toEventResponse(event, series, userEmail, imageService),
        )
    }
}
