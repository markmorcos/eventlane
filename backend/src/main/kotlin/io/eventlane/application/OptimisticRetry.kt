package io.eventlane.application

import io.eventlane.application.ports.EventRepository
import io.eventlane.domain.model.ConflictException
import io.eventlane.domain.model.Event
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class OptimisticRetry(
    private val repository: EventRepository,
    private val maxRetries: Int = 3,
) {

    private val logger = LoggerFactory.getLogger(javaClass)

    fun <T> run(slug: String, block: (Event) -> Pair<Event, T>): Pair<Event, T> {
        repeat(maxRetries) { attempt ->
            val current = repository.findBySlug(slug)

            val (updatedEvent, result) = block(current)

            try {
                val saved = repository.save(updatedEvent)
                return saved to result
            } catch (e: ConflictException) {
                logger.warn("Conflict on $slug attempt ${attempt + 1}, retrying...")
            }
        }
        throw ConflictException("Event $slug modified by another request. Retry limit reached.")
    }
}
