package io.eventlane.persistence

import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

@Repository
interface EventRepository : MongoRepository<EventDocument, String> {
    fun findBySlug(slug: String): EventDocument?
    fun existsBySlug(slug: String): Boolean
}
