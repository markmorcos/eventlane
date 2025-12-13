package io.eventlane.persistence.repository

import io.eventlane.persistence.document.EventDocument
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.data.mongodb.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface SpringDataEventRepository : MongoRepository<EventDocument, String> {
    fun findBySlug(slug: String): EventDocument?
    fun existsBySlug(slug: String): Boolean
    fun deleteBySlug(slug: String)
    fun findBySeriesId(seriesId: String): List<EventDocument>
    fun findBySeriesIdAndDeletedAtIsNull(seriesId: String): List<EventDocument>
    fun findBySeriesIdAndDeletedAtIsNullAndEventDateGreaterThanEqual(
        seriesId: String,
        eventDate: Instant,
    ): List<EventDocument>

    @Query(
        """
        {
            'seriesId': ?0,
            'deletedAt': null,
            'eventDate': { ${'$'}gte: ?1 },
            ${'$'}or: [
                { 'attendees': { ${'$'}elemMatch: { 'email': ?2, 'status': 'CONFIRMED' } } },
                { 'attendees': { ${'$'}elemMatch: { 'email': ?2, 'status': 'WAITLISTED' } } }
            ]
        }
    """,
    )
    fun findUpcomingEventsWhereUserAttends(seriesId: String, eventDate: Instant, email: String): List<EventDocument>
}
