package io.eventlane.application.service

import io.eventlane.application.OptimisticRetry
import io.eventlane.application.ports.EventDeltaPublisher
import io.eventlane.application.ports.EventRepository
import io.eventlane.application.ports.EventSeriesRepository
import io.eventlane.domain.behavior.EventBehavior
import io.eventlane.domain.model.AttendeeStatus
import io.eventlane.domain.model.AttendeeStatusChanged
import io.eventlane.domain.model.Event
import io.eventlane.domain.model.EventCoverImageUpdated
import io.eventlane.domain.model.EventCreated
import io.eventlane.domain.model.EventDateTimeUpdated
import io.eventlane.domain.model.EventDeleted
import io.eventlane.domain.model.EventDelta
import io.eventlane.domain.model.EventDescriptionUpdated
import io.eventlane.domain.model.EventLocationUpdated
import io.eventlane.domain.model.Location
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Lazy
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class EventCommandService(
    private val retry: OptimisticRetry,
    private val repository: EventRepository,
    private val seriesRepository: EventSeriesRepository,
    private val publisher: EventDeltaPublisher,
    private val imageService: ImageStorageService,
    private val emailService: EmailNotificationService,
    @Lazy private val seriesCommandService: EventSeriesCommandService,
) {
    private val logger = LoggerFactory.getLogger(EventCommandService::class.java)

    fun createEvent(
        capacity: Int,
        eventDate: Instant,
        timezone: String,
        seriesId: String,
        location: Location? = null,
        description: String? = null,
        coverImageUrl: String? = null,
    ): EventDelta {
        val series = seriesRepository.findById(seriesId)

        val dateFormatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd-HHmm")
            .withZone(java.time.ZoneId.of(timezone))
        val dateString = dateFormatter.format(eventDate)
        val slug = "${series.slug}-$dateString"

        val now = Instant.now()

        val event = Event(
            slug = slug,
            capacity = capacity,
            eventDate = eventDate,
            timezone = timezone,
            location = location,
            description = description,
            coverImageUrl = coverImageUrl,
            attendees = emptyList(),
            seriesId = seriesId,
            deletedAt = null,
            createdAt = now,
            updatedAt = now,
        )

        val saved = repository.save(event)

        val delta = EventCreated(
            version = saved.version ?: 0L,
            timestamp = now,
            eventSlug = saved.slug,
            capacity = saved.capacity,
            eventDate = saved.eventDate,
            timezone = saved.timezone,
        )

        publisher.publish(saved, listOf(delta))

        return delta
    }

    fun updateCapacity(slug: String, newCapacity: Int): List<EventDelta> {
        val (saved, deltas) = retry.run(slug) { event ->
            EventBehavior.updateCapacity(event, newCapacity)
        }

        publisher.publish(saved, deltas)

        // Send email notifications for status changes
        val series = seriesRepository.findById(saved.seriesId)
        deltas.filterIsInstance<AttendeeStatusChanged>().forEach { delta ->
            val attendee = saved.findAttendeeByEmail(delta.attendeeEmail)
            if (attendee != null) {
                when (delta.newStatus) {
                    AttendeeStatus.CONFIRMED -> emailService.sendPromotionEmail(
                        attendee,
                        saved,
                        series.title,
                        attendee.language,
                    )
                    AttendeeStatus.WAITLISTED -> emailService.sendDowngradeEmail(
                        attendee,
                        saved,
                        series.title,
                        attendee.language,
                    )
                    else -> {} // No email for other statuses
                }
            }
        }

        return deltas
    }

    fun deleteEvent(slug: String): EventDelta {
        val now = Instant.now()

        val event = repository.findBySlug(slug)
        val series = seriesRepository.findById(event.seriesId)

        val delta = EventDeleted(
            version = (event.version ?: 0L) + 1,
            timestamp = now,
            eventSlug = event.slug,
        )

        publisher.publish(event, listOf(delta))

        // Send cancellation emails to all attendees
        val allAttendees = event.confirmedList + event.waitingList
        allAttendees.forEach { attendee ->
            emailService.sendEventCancellationEmail(attendee, event, series.title, attendee.language)
        }

        // Delete associated cover images from MinIO
        if (event.coverImageUrl != null) {
            try {
                imageService.deleteEventImages(slug)
            } catch (e: Exception) {
                logger.error("Failed to delete images for event $slug during event deletion", e)
            }
        }

        val deletedEvent = event.copy(
            deletedAt = now,
            updatedAt = now,
        )
        repository.save(deletedEvent)

        if (series.isOneOff()) {
            val remainingEvents = repository.findActiveBySeriesId(series.id!!)
            if (remainingEvents.isEmpty()) {
                // No active events remain, delete the series
                seriesCommandService.deleteSeries(series.slug)
            }
        }

        return delta
    }

    fun updateDateTime(slug: String, eventDate: Instant, timezone: String): EventDelta {
        val (saved, delta) = retry.run(slug) { event ->
            val now = Instant.now()
            val updated = event.copy(
                eventDate = eventDate,
                timezone = timezone,
                updatedAt = now,
            )
            val delta = EventDateTimeUpdated(
                version = (updated.version ?: 0L) + 1,
                timestamp = now,
                eventSlug = updated.slug,
                eventDate = eventDate,
                timezone = timezone,
            )
            updated to delta
        }

        publisher.publish(saved, listOf(delta))

        return delta
    }

    fun updateLocation(slug: String, location: Location?): EventDelta {
        val (saved, delta) = retry.run(slug) { event ->
            val now = Instant.now()
            val updated = event.copy(
                location = location,
                updatedAt = now,
            )
            val delta = EventLocationUpdated(
                version = (updated.version ?: 0L) + 1,
                timestamp = now,
                eventSlug = updated.slug,
                location = location,
            )
            updated to delta
        }

        publisher.publish(saved, listOf(delta))

        return delta
    }

    fun updateDescription(slug: String, description: String?): EventDelta {
        val (saved, delta) = retry.run(slug) { event ->
            val now = Instant.now()
            val updated = event.copy(
                description = description?.takeIf { it.isNotBlank() }?.take(700),
                updatedAt = now,
            )
            val delta = EventDescriptionUpdated(
                version = (updated.version ?: 0L) + 1,
                timestamp = now,
                eventSlug = updated.slug,
                description = updated.description,
            )
            updated to delta
        }

        publisher.publish(saved, listOf(delta))

        return delta
    }

    fun updateCoverImage(slug: String, coverImageUrl: String?): EventDelta {
        val (saved, delta) = retry.run(slug) { event ->
            val now = Instant.now()
            val updated = event.copy(
                coverImageUrl = coverImageUrl,
                updatedAt = now,
            )

            val coverImages = if (coverImageUrl != null) {
                mapOf(
                    "desktop" to imageService.getPublicImageUrl(slug, "desktop"),
                    "mobile" to imageService.getPublicImageUrl(slug, "mobile"),
                )
            } else {
                null
            }

            val delta = EventCoverImageUpdated(
                version = (updated.version ?: 0L) + 1,
                timestamp = now,
                eventSlug = updated.slug,
                coverImages = coverImages,
            )
            updated to delta
        }

        publisher.publish(saved, listOf(delta))

        return delta
    }
}
