package io.eventlane.persistence.repository

import io.eventlane.persistence.document.EventDocument
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

@Repository
interface SpringDataEventRepository : MongoRepository<EventDocument, String> {
    fun findBySlug(slug: String): EventDocument?
    fun existsBySlug(slug: String): Boolean
    fun deleteBySlug(slug: String)
    fun findByCreatorEmailOrAdminsContaining(creatorEmail: String, adminEmail: String): List<EventDocument>
}
