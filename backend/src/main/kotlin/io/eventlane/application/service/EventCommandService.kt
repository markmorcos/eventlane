package io.eventlane.application.service

import io.eventlane.application.OptimisticRetry
import io.eventlane.application.ports.EventDeltaPublisher
import io.eventlane.application.ports.EventRepository
import io.eventlane.domain.behavior.EventBehavior
import io.eventlane.domain.model.Event
import io.eventlane.domain.model.EventCoverImageUpdated
import io.eventlane.domain.model.EventCreated
import io.eventlane.domain.model.EventDateTimeUpdated
import io.eventlane.domain.model.EventDeleted
import io.eventlane.domain.model.EventDelta
import io.eventlane.domain.model.EventDescriptionUpdated
import io.eventlane.domain.model.EventLocationUpdated
import io.eventlane.domain.model.Location
import io.eventlane.domain.util.SlugGenerator
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class EventCommandService(
    private val retry: OptimisticRetry,
    private val repository: EventRepository,
    private val publisher: EventDeltaPublisher,
) {

    fun createEvent(
        title: String,
        capacity: Int,
        eventDate: Instant,
        timezone: String,
        creatorEmail: String,
    ): EventDelta {
        val slug = SlugGenerator.generateUniqueSlug(title) { repository.existsBySlug(it) }

        val now = Instant.now()

        val event = Event(
            slug = slug,
            title = title,
            capacity = capacity,
            eventDate = eventDate,
            timezone = timezone,
            location = null,
            description = null,
            coverImageUrl = null,
            confirmedList = emptyList(),
            waitingList = emptyList(),
            creatorEmail = creatorEmail.lowercase(),
            admins = emptyList(),
            createdAt = now,
            updatedAt = now,
        )

        val saved = repository.save(event)

        val delta = EventCreated(
            version = saved.version ?: 0L,
            timestamp = now,
            eventSlug = saved.slug,
            title = saved.title,
            capacity = saved.capacity,
        )

        publisher.publish(saved, listOf(delta))

        return delta
    }

    fun updateCapacity(slug: String, newCapacity: Int): List<EventDelta> {
        val (saved, deltas) = retry.run(slug) { event ->
            EventBehavior.updateCapacity(event, newCapacity)
        }

        publisher.publish(saved, deltas)

        return deltas
    }

    fun deleteEvent(slug: String): EventDelta {
        val now = Instant.now()

        val event = repository.findBySlug(slug)

        val delta = EventDeleted(
            version = (event.version ?: 0L) + 1,
            timestamp = now,
            eventSlug = event.slug,
        )

        publisher.publish(event, listOf(delta))

        repository.deleteBySlug(slug)

        return delta
    }

    fun addAdmin(slug: String, adminEmail: String): List<EventDelta> {
        val (saved, deltas) = retry.run(slug) { event ->
            EventBehavior.addAdmin(event, adminEmail)
        }

        publisher.publish(saved, deltas)

        return deltas
    }

    fun removeAdmin(slug: String, adminEmail: String): List<EventDelta> {
        val (saved, deltas) = retry.run(slug) { event ->
            EventBehavior.removeAdmin(event, adminEmail)
        }

        publisher.publish(saved, deltas)

        return deltas
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
            val delta = EventCoverImageUpdated(
                version = (updated.version ?: 0L) + 1,
                timestamp = now,
                eventSlug = updated.slug,
                coverImageUrl = coverImageUrl,
            )
            updated to delta
        }

        publisher.publish(saved, listOf(delta))

        return delta
    }
}
