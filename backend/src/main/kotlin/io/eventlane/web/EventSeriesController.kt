package io.eventlane.web

import io.eventlane.application.ports.EventRepository
import io.eventlane.application.ports.EventSeriesRepository
import io.eventlane.application.service.EventCommandService
import io.eventlane.application.service.EventSeriesCommandService
import io.eventlane.application.service.ImageStorageService
import io.eventlane.auth.SecurityUser
import io.eventlane.domain.model.ForbiddenException
import io.eventlane.web.dto.CreateEventForSeriesRequestDto
import io.eventlane.web.dto.CreateEventSeriesRequestDto
import io.eventlane.web.dto.DtoMapper
import io.eventlane.web.dto.EventResponseDto
import io.eventlane.web.dto.EventSeriesResponseDto
import io.eventlane.web.dto.UpdateEventSeriesRequestDto
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/api/admin/series")
class EventSeriesController(
    private val seriesRepository: EventSeriesRepository,
    private val eventRepository: EventRepository,
    private val commands: EventSeriesCommandService,
    private val eventCommands: EventCommandService,
    private val imageService: ImageStorageService,
) {

    @GetMapping
    fun listSeries(@AuthenticationPrincipal user: SecurityUser): List<EventSeriesResponseDto> {
        val series = seriesRepository.findByCreatorOrAdmin(user.email)
        val now = Instant.now()

        return series.map { s ->
            val upcomingEvents = eventRepository.findUpcomingActiveBySeriesId(s.id!!, now)
                .sortedBy { it.eventDate }

            val nextEvent = upcomingEvents.firstOrNull()

            EventSeriesResponseDto(
                slug = s.slug,
                title = s.title,
                interval = s.interval?.toString(),
                leadWeeks = s.leadWeeks,
                autoGenerate = s.autoGenerate,
                anchorDate = s.anchorDate,
                timezone = s.timezone,
                endDate = s.endDate,
                nextEventDate = nextEvent?.eventDate,
                nextEventSlug = nextEvent?.slug,
                upcomingEventsCount = upcomingEvents.size,
                creatorEmail = s.creatorEmail,
                admins = s.admins,
                createdAt = s.createdAt,
                updatedAt = s.updatedAt,
            )
        }
    }

    @GetMapping("/{slug}")
    fun getSeries(@PathVariable slug: String, @AuthenticationPrincipal user: SecurityUser): EventSeriesResponseDto {
        val series = seriesRepository.findBySlug(slug)

        if (!series.isAdmin(user.email)) {
            throw ForbiddenException("Not authorized to view this series")
        }

        val now = Instant.now()
        val upcomingEvents = eventRepository.findUpcomingActiveBySeriesId(series.id!!, now)
            .sortedBy { it.eventDate }

        val nextEvent = upcomingEvents.firstOrNull()

        return EventSeriesResponseDto(
            slug = series.slug,
            title = series.title,
            interval = series.interval?.toString(),
            leadWeeks = series.leadWeeks,
            autoGenerate = series.autoGenerate,
            anchorDate = series.anchorDate,
            timezone = series.timezone,
            endDate = series.endDate,
            nextEventDate = nextEvent?.eventDate,
            nextEventSlug = nextEvent?.slug,
            upcomingEventsCount = upcomingEvents.size,
            creatorEmail = series.creatorEmail,
            admins = series.admins,
            createdAt = series.createdAt,
            updatedAt = series.updatedAt,
        )
    }

    @PostMapping
    fun createSeries(
        @RequestBody request: CreateEventSeriesRequestDto,
        @AuthenticationPrincipal user: SecurityUser,
    ): EventSeriesResponseDto {
        val series = commands.createSeries(
            title = request.title,
            capacity = request.capacity,
            firstEventDate = request.firstEventDate,
            timezone = request.timezone,
            interval = request.interval,
            leadWeeks = request.leadWeeks,
            autoGenerate = request.autoGenerate,
            endDate = request.endDate,
            creatorEmail = user.email,
        )

        return DtoMapper.toEventSeriesResponseDto(series)
    }

    @PatchMapping("/{slug}")
    fun updateSeries(
        @PathVariable slug: String,
        @RequestBody request: UpdateEventSeriesRequestDto,
        @AuthenticationPrincipal user: SecurityUser,
    ): EventSeriesResponseDto {
        val series = seriesRepository.findBySlug(slug)

        if (!series.isAdmin(user.email)) {
            throw ForbiddenException("Not authorized to modify this series")
        }

        val updated = commands.updateSeries(
            slug = slug,
            anchorDate = request.anchorDate,
            timezone = request.timezone,
            interval = request.interval,
            leadWeeks = request.leadWeeks,
            autoGenerate = request.autoGenerate,
            endDate = request.endDate,
        )

        return DtoMapper.toEventSeriesResponseDto(updated)
    }

    @DeleteMapping("/{slug}")
    fun deleteSeries(@PathVariable slug: String, @AuthenticationPrincipal user: SecurityUser) {
        val series = seriesRepository.findBySlug(slug)

        if (!series.isAdmin(user.email)) {
            throw ForbiddenException("Not authorized to delete this series")
        }

        commands.deleteSeries(slug)
    }

    @PostMapping("/{slug}/admins")
    fun addAdmin(
        @PathVariable slug: String,
        @RequestBody request: Map<String, String>,
        @AuthenticationPrincipal user: SecurityUser,
    ): EventSeriesResponseDto {
        val series = seriesRepository.findBySlug(slug)

        if (!series.isAdmin(user.email)) {
            throw ForbiddenException("Not authorized to manage admins")
        }

        val adminEmail = request["email"] ?: throw IllegalArgumentException("Email is required")
        val updated = commands.addAdmin(slug, adminEmail)

        return DtoMapper.toEventSeriesResponseDto(updated)
    }

    @DeleteMapping("/{slug}/admins/{email}")
    fun removeAdmin(
        @PathVariable slug: String,
        @PathVariable email: String,
        @AuthenticationPrincipal user: SecurityUser,
    ): EventSeriesResponseDto {
        val series = seriesRepository.findBySlug(slug)

        if (!series.isAdmin(user.email)) {
            throw ForbiddenException("Not authorized to manage admins")
        }

        val updated = commands.removeAdmin(slug, email)

        return DtoMapper.toEventSeriesResponseDto(updated)
    }

    @PostMapping("/{slug}/events")
    fun createEventForSeries(
        @PathVariable slug: String,
        @RequestBody request: CreateEventForSeriesRequestDto,
        @AuthenticationPrincipal user: SecurityUser,
    ): EventResponseDto {
        val series = seriesRepository.findBySlug(slug)

        if (!series.isAdmin(user.email)) {
            throw ForbiddenException("Not authorized to create events for this series")
        }

        val eventDelta = eventCommands.createEvent(
            capacity = request.capacity,
            eventDate = request.eventDate,
            timezone = request.timezone,
            seriesId = series.id!!,
        )

        val event = eventRepository.findBySlug(eventDelta.eventSlug)

        return DtoMapper.toEventResponse(event, series, user.email, imageService)
    }

    @GetMapping("/{slug}/events")
    fun getEventsForSeries(
        @PathVariable slug: String,
        @AuthenticationPrincipal user: SecurityUser,
    ): List<EventResponseDto> {
        val series = seriesRepository.findBySlug(slug)

        if (!series.isAdmin(user.email)) {
            throw ForbiddenException("Not authorized to view events for this series")
        }

        val events = eventRepository.findActiveBySeriesId(series.id!!)
            .sortedBy { it.eventDate }

        return events.map { DtoMapper.toEventResponse(it, series, user.email, imageService) }
    }
}
