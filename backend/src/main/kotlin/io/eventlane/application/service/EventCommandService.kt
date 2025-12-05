package io.eventlane.application.service

import io.eventlane.application.OptimisticRetry
import io.eventlane.application.ports.EventDeltaPublisher
import io.eventlane.application.ports.EventRepository
import io.eventlane.domain.behavior.EventBehavior
import io.eventlane.domain.model.Event
import io.eventlane.domain.model.EventCreated
import io.eventlane.domain.model.EventDeleted
import io.eventlane.domain.model.EventDelta
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class EventCommandService(
    private val retry: OptimisticRetry,
    private val repository: EventRepository,
    private val publisher: EventDeltaPublisher,
) {

    fun createEvent(slug: String, title: String, capacity: Int, creatorEmail: String): EventDelta {
        if (repository.existsBySlug(slug)) {
            throw IllegalArgumentException("Event already exists: $slug")
        }

        val now = Instant.now()

        val event = Event(
            slug = slug,
            title = title,
            capacity = capacity,
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

        publisher.publish(slug, listOf(delta))

        return delta
    }

    fun updateCapacity(slug: String, newCapacity: Int): List<EventDelta> {
        val (_, deltas) = retry.run(slug) { event ->
            EventBehavior.updateCapacity(event, newCapacity)
        }

        publisher.publish(slug, deltas)

        return deltas
    }

    fun deleteEvent(slug: String): EventDelta {
        val now = Instant.now()

        val event = repository.findBySlug(slug)

        repository.deleteBySlug(slug)

        val delta = EventDeleted(
            version = event.version ?: 0L,
            timestamp = now,
            eventSlug = event.slug,
        )

        publisher.publish(slug, listOf(delta))

        return delta
    }

    fun addAdmin(slug: String, adminEmail: String): List<EventDelta> {
        val (_, deltas) = retry.run(slug) { event ->
            EventBehavior.addAdmin(event, adminEmail)
        }

        publisher.publish(slug, deltas)

        return deltas
    }

    fun removeAdmin(slug: String, adminEmail: String): List<EventDelta> {
        val (_, deltas) = retry.run(slug) { event ->
            EventBehavior.removeAdmin(event, adminEmail)
        }

        publisher.publish(slug, deltas)

        return deltas
    }
}
