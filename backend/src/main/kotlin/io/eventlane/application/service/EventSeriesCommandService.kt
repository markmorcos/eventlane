package io.eventlane.application.service

import io.eventlane.application.ports.EventRepository
import io.eventlane.application.ports.EventSeriesRepository
import io.eventlane.application.scheduler.RecurrenceGenerationJob
import io.eventlane.domain.model.EventSeries
import io.eventlane.domain.model.EventSeriesCreated
import io.eventlane.domain.model.EventSeriesDeleted
import io.eventlane.domain.model.EventSeriesUpdated
import io.eventlane.domain.util.SlugGenerator
import io.eventlane.websocket.EventSeriesWebSocketPublisher
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class EventSeriesCommandService(
    private val seriesRepository: EventSeriesRepository,
    private val eventRepository: EventRepository,
    private val eventCommandService: EventCommandService,
    private val recurrenceGenerationJob: RecurrenceGenerationJob,
    private val seriesWebSocketPublisher: EventSeriesWebSocketPublisher,
) {

    fun createSeries(
        title: String,
        capacity: Int,
        firstEventDate: Instant,
        timezone: String,
        interval: String?,
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
            timezone = timezone,
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

        // Immediately generate future events if autoGenerate is enabled
        if (autoGenerate && interval != null) {
            recurrenceGenerationJob.generateEventsForSeries(savedSeries)
        }

        // Publish EventSeriesCreated delta
        val delta = EventSeriesCreated(
            version = 1L,
            timestamp = now,
            seriesSlug = savedSeries.slug,
            slug = savedSeries.slug,
            title = savedSeries.title,
            anchorDate = savedSeries.anchorDate.toEpochMilli(),
            timezone = savedSeries.timezone,
            interval = savedSeries.interval,
            leadWeeks = savedSeries.leadWeeks,
            endDate = savedSeries.endDate?.toEpochMilli(),
            createdAt = savedSeries.createdAt.toEpochMilli(),
            createdBy = savedSeries.creatorEmail,
        )
        seriesWebSocketPublisher.publishSeriesDeltas(savedSeries, listOf(delta))

        return savedSeries
    }

    fun updateSeries(
        slug: String,
        anchorDate: Instant? = null,
        timezone: String? = null,
        interval: String? = null,
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
            timezone = timezone ?: series.timezone,
            interval = newInterval,
            leadWeeks = leadWeeks ?: series.leadWeeks,
            autoGenerate = autoGenerate ?: series.autoGenerate,
            endDate = newEndDate,
            updatedAt = Instant.now(),
        )

        val savedSeries = seriesRepository.save(updated)

        // If anchorDate, interval, or endDate changed, regenerate future events
        if (anchorDate != null || interval != null || leadWeeks != null || endDate != null) {
            regenerateFutureEvents(savedSeries)
        }

        // Publish EventSeriesUpdated delta
        val hasChanges = anchorDate != null || timezone != null || interval != null ||
            leadWeeks != null || autoGenerate != null || endDate != null
        val delta = EventSeriesUpdated(
            version = savedSeries.version ?: 1L,
            timestamp = savedSeries.updatedAt,
            seriesSlug = savedSeries.slug,
            slug = savedSeries.slug,
            title = if (hasChanges) savedSeries.title else null,
            interval = interval,
            leadWeeks = leadWeeks,
            endDate = endDate?.toEpochMilli(),
        )
        seriesWebSocketPublisher.publishSeriesDeltas(savedSeries, listOf(delta))

        return savedSeries
    }

    private fun regenerateFutureEvents(series: EventSeries) {
        val now = Instant.now()
        val events = eventRepository.findActiveBySeriesId(series.id!!)

        val templateEvent = events.firstOrNull()

        if (templateEvent == null) {
            return
        }

        val eventsForDeletion = if (series.leadWeeks < events.size) {
            events.drop(series.leadWeeks).filter { it.eventDate >= now && it.deletedAt == null }
        } else {
            emptyList()
        }

        if (series.interval != null && series.autoGenerate) {
            recurrenceGenerationJob.generateEventsForSeries(series)
        }

        eventsForDeletion.forEach { event ->
            eventCommandService.deleteEvent(event.slug)
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

        // Publish EventSeriesDeleted delta
        val delta = EventSeriesDeleted(
            version = series.version ?: 1L,
            timestamp = Instant.now(),
            seriesSlug = series.slug,
            slug = series.slug,
        )
        seriesWebSocketPublisher.publishSeriesDeltas(series, listOf(delta))
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
