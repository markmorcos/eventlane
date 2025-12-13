package io.eventlane.web

import io.eventlane.application.ports.EventRepository
import io.eventlane.application.ports.EventSeriesRepository
import io.eventlane.application.service.EventSeriesCommandService
import io.eventlane.auth.SecurityUser
import io.eventlane.domain.model.ForbiddenException
import io.eventlane.web.dto.CreateEventSeriesRequestDto
import io.eventlane.web.dto.DtoMapper
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
) {

    @GetMapping
    fun listSeries(@AuthenticationPrincipal user: SecurityUser): List<EventSeriesResponseDto> {
        val series = seriesRepository.findByCreatorOrAdmin(user.email)

        return series.map { s ->
            // Get the next upcoming event for this series
            val upcomingEvents = eventRepository.findActiveBySeriesId(s.id!!)
                .filter { it.eventDate >= Instant.now() }
                .sortedBy { it.eventDate }

            val nextEvent = upcomingEvents.firstOrNull()

            EventSeriesResponseDto(
                slug = s.slug,
                title = s.title,
                interval = s.interval?.toString(),
                leadWeeks = s.leadWeeks,
                autoGenerate = s.autoGenerate,
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

        val upcomingEvents = eventRepository.findActiveBySeriesId(series.id!!)
            .filter { it.eventDate >= Instant.now() }
            .sortedBy { it.eventDate }

        val nextEvent = upcomingEvents.firstOrNull()

        return EventSeriesResponseDto(
            slug = series.slug,
            title = series.title,
            interval = series.interval?.toString(),
            leadWeeks = series.leadWeeks,
            autoGenerate = series.autoGenerate,
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
}
