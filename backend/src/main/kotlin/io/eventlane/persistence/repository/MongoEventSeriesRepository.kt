package io.eventlane.persistence.repository

import io.eventlane.application.ports.EventSeriesRepository
import io.eventlane.domain.model.ConflictException
import io.eventlane.domain.model.EventSeries
import io.eventlane.domain.model.NotFoundException
import io.eventlane.persistence.mapper.EventSeriesPersistenceMapper
import org.springframework.dao.OptimisticLockingFailureException
import org.springframework.stereotype.Component

@Component
class MongoEventSeriesRepository(
    private val springDataRepository: SpringDataEventSeriesRepository,
) : EventSeriesRepository {

    private val logger = org.slf4j.LoggerFactory.getLogger(MongoEventSeriesRepository::class.java)

    override fun findBySlug(slug: String): EventSeries {
        val document = springDataRepository.findBySlug(slug)
            ?: throw NotFoundException("Event series not found: $slug")
        return EventSeriesPersistenceMapper.toDomain(document)
    }

    override fun findById(id: String): EventSeries {
        val document = springDataRepository.findById(id).orElse(null)
            ?: throw NotFoundException("Event series not found: $id")
        return EventSeriesPersistenceMapper.toDomain(document)
    }

    override fun save(series: EventSeries): EventSeries {
        try {
            val document = EventSeriesPersistenceMapper.toDocument(series)

            val saved = if (document.id.isNullOrEmpty()) {
                springDataRepository.insert(document)
            } else {
                springDataRepository.save(document)
            }

            return EventSeriesPersistenceMapper.toDomain(saved)
        } catch (ex: OptimisticLockingFailureException) {
            logger.error("Optimistic locking failure when saving event series: ${series.slug}", ex)
            throw ConflictException("Event series was modified by another request. Please retry.")
        }
    }

    override fun existsBySlug(slug: String) = springDataRepository.existsBySlug(slug)

    override fun findByCreatorOrAdmin(email: String) =
        springDataRepository.findByCreatorEmailOrAdminsContaining(email, email)
            .map(EventSeriesPersistenceMapper::toDomain)

    override fun findByAutoGenerateTrue() = springDataRepository.findByAutoGenerateTrue()
        .map(EventSeriesPersistenceMapper::toDomain)

    override fun deleteBySlug(slug: String) = springDataRepository.deleteBySlug(slug)
}
