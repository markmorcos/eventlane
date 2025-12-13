package io.eventlane.persistence.repository

import io.eventlane.application.ports.EventRepository
import io.eventlane.domain.model.ConflictException
import io.eventlane.domain.model.Event
import io.eventlane.domain.model.NotFoundException
import io.eventlane.persistence.mapper.EventPersistenceMapper
import org.springframework.dao.OptimisticLockingFailureException
import org.springframework.stereotype.Component

@Component
class MongoEventRepository(
    private val springDataRepository: SpringDataEventRepository,
) : EventRepository {

    private val logger = org.slf4j.LoggerFactory.getLogger(MongoEventRepository::class.java)

    override fun findBySlug(slug: String): Event {
        val document = springDataRepository.findBySlug(slug)
            ?: throw NotFoundException("Event not found: $slug")
        return EventPersistenceMapper.toDomain(document)
    }

    override fun save(event: Event): Event {
        try {
            val document = EventPersistenceMapper.toDocument(event)

            val saved = if (document.id.isNullOrEmpty()) {
                springDataRepository.insert(document)
            } else {
                springDataRepository.save(document)
            }

            return EventPersistenceMapper.toDomain(saved)
        } catch (ex: OptimisticLockingFailureException) {
            logger.error("Optimistic locking failure when saving event: ${event.slug}", ex)
            throw ConflictException("Event was modified by another request. Please retry.")
        }
    }

    override fun existsBySlug(slug: String) = springDataRepository.existsBySlug(slug)

    override fun deleteBySlug(slug: String) = springDataRepository.deleteBySlug(slug)

    override fun findBySeriesId(seriesId: String) = springDataRepository.findBySeriesId(seriesId)
        .map(EventPersistenceMapper::toDomain)

    override fun findActiveBySeriesId(seriesId: String) = springDataRepository.findBySeriesIdAndDeletedAtIsNull(
        seriesId,
    )
        .map(EventPersistenceMapper::toDomain)
}
