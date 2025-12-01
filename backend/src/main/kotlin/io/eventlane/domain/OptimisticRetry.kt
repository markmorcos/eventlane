package io.eventlane.domain

import io.eventlane.persistence.EventDocument
import io.eventlane.persistence.EventRepository
import org.slf4j.LoggerFactory
import org.springframework.dao.OptimisticLockingFailureException
import org.springframework.stereotype.Component
import java.time.Instant

@Component
class OptimisticRetry(
    private val eventRepository: EventRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    
    fun <T> doWithRetry(slug: String, maxRetries: Int = 5, block: (EventDocument) -> T): T {
        var attempt = 0
        while (true) {
            attempt++
            val event = eventRepository.findBySlug(slug)
                ?: throw NotFoundException("Event not found: $slug")
            
            val result = block(event)
            
            try {
                event.updatedAt = Instant.now()
                eventRepository.save(event)
                logger.debug("Successfully saved event $slug on attempt $attempt")
                return result
            } catch (ex: OptimisticLockingFailureException) {
                logger.warn("Optimistic locking failure for event $slug on attempt $attempt")
                if (attempt >= maxRetries) {
                    throw ConflictException("Too many concurrent updates for event: $slug")
                }
                // retry by continuing loop
                Thread.sleep(50L * attempt) // exponential backoff
            }
        }
    }
}
