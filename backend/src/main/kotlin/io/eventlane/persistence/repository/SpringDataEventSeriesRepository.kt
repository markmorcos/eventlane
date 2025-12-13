package io.eventlane.persistence.repository

import io.eventlane.persistence.document.EventSeriesDocument
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

@Repository
interface SpringDataEventSeriesRepository : MongoRepository<EventSeriesDocument, String> {
    fun findBySlug(slug: String): EventSeriesDocument?
    fun existsBySlug(slug: String): Boolean
    fun deleteBySlug(slug: String)
    fun findByCreatorEmailOrAdminsContaining(creatorEmail: String, adminEmail: String): List<EventSeriesDocument>
    fun findByAutoGenerateTrue(): List<EventSeriesDocument>
}
