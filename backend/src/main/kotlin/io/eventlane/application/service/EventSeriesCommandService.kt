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
        leadWeeks: Int? = null,
        autoGenerate: Boolean? = null,
        endDate: Instant? = null,
    ): EventSeries {
        val series = seriesRepository.findBySlug(slug)

        val updated = series.copy(
            leadWeeks = leadWeeks ?: series.leadWeeks,
            autoGenerate = autoGenerate ?: series.autoGenerate,
            endDate = endDate,
            updatedAt = Instant.now(),
        )

        return seriesRepository.save(updated)
    }

    fun deleteSeries(slug: String) {
        val series = seriesRepository.findBySlug(slug)

        val events = eventRepository.findActiveBySeriesId(series.id!!)
        val now = Instant.now()

        events.forEach { event ->
            if (event.eventDate >= now && event.deletedAt == null) {
                val deletedEvent = event.copy(
                    deletedAt = now,
                    updatedAt = now,
                )
                eventRepository.save(deletedEvent)
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
