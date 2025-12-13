package io.eventlane.application.service

import io.eventlane.application.ports.EventRepository
import io.eventlane.application.ports.EventSeriesRepository
import io.eventlane.domain.model.EventSeries
import io.eventlane.domain.util.SlugGenerator
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant

@Service
class EventSeriesCommandService(
    private val seriesRepository: EventSeriesRepository,
    private val eventRepository: EventRepository,
    private val eventCommandService: EventCommandService,
) {

    fun createSeries(
        title: String,
        capacity: Int,
        firstEventDate: Instant,
        timezone: String,
        interval: Duration?,
        leadWeeks: Int,
        autoGenerate: Boolean,
        endDate: Instant?,
        creatorEmail: String,
    ): EventSeries {
        val slug = SlugGenerator.generateUniqueSlug(title) { seriesRepository.existsBySlug(it) }

        val now = Instant.now()

        val series = EventSeries(
            slug = slug,
            title = title,
            interval = interval,
            leadWeeks = leadWeeks,
            autoGenerate = autoGenerate,
            anchorDate = firstEventDate,
            endDate = endDate,
            creatorEmail = creatorEmail.lowercase(),
            admins = emptyList(),
            createdAt = now,
            updatedAt = now,
        )

        val savedSeries = seriesRepository.save(series)

        // Create the first event
        eventCommandService.createEvent(
            capacity = capacity,
            eventDate = firstEventDate,
            timezone = timezone,
            seriesId = savedSeries.id!!,
        )

        return savedSeries
    }

    fun updateSeries(
        slug: String,
        anchorDate: Instant? = null,
        interval: Duration? = null,
        leadWeeks: Int? = null,
        autoGenerate: Boolean? = null,
        endDate: Instant? = null,
    ): EventSeries {
        val series = seriesRepository.findBySlug(slug)

        val newAnchorDate = anchorDate ?: series.anchorDate
        val newInterval = interval ?: series.interval
        val newEndDate = endDate ?: series.endDate

        val updated = series.copy(
            anchorDate = newAnchorDate,
            interval = newInterval,
            leadWeeks = leadWeeks ?: series.leadWeeks,
            autoGenerate = autoGenerate ?: series.autoGenerate,
            endDate = newEndDate,
            updatedAt = Instant.now(),
        )

        val savedSeries = seriesRepository.save(updated)

        // If anchorDate, interval, or endDate changed, regenerate future events
        if (anchorDate != null || interval != null || endDate != null) {
            regenerateFutureEvents(savedSeries)
        }

        return savedSeries
    }

    private fun regenerateFutureEvents(series: EventSeries) {
        val now = Instant.now()
        val events = eventRepository.findActiveBySeriesId(series.id!!)

        events.forEach { event ->
            if (event.eventDate >= now && event.deletedAt == null) {
                eventCommandService.deleteEvent(event.slug)
            }
        }

        // If series has interval and autoGenerate, generate new events
        if (series.interval != null && series.autoGenerate) {
            // The RecurrenceGenerationJob will handle creating new events
            // based on the updated anchorDate and interval
        }
    }

    fun deleteSeries(slug: String) {
        val series = seriesRepository.findBySlug(slug)

        val events = eventRepository.findActiveBySeriesId(series.id!!)
        val now = Instant.now()

        // Delete future events and emit deltas
        events.forEach { event ->
            if (event.eventDate >= now && event.deletedAt == null) {
                eventCommandService.deleteEvent(event.slug)
            }
        }

        seriesRepository.deleteBySlug(slug)
    }

    fun addAdmin(slug: String, adminEmail: String): EventSeries {
        val series = seriesRepository.findBySlug(slug)

        if (series.admins.contains(adminEmail.lowercase())) {
            return series
        }

        val updated = series.copy(
            admins = series.admins + adminEmail.lowercase(),
            updatedAt = Instant.now(),
        )

        return seriesRepository.save(updated)
    }

    fun removeAdmin(slug: String, adminEmail: String): EventSeries {
        val series = seriesRepository.findBySlug(slug)

        val updated = series.copy(
            admins = series.admins.filter { it != adminEmail.lowercase() },
            updatedAt = Instant.now(),
        )

        return seriesRepository.save(updated)
    }
}
