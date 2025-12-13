package io.eventlane.persistence.repository

import io.eventlane.persistence.document.UserPreferencesDocument
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

@Repository
interface SpringDataUserPreferencesRepository : MongoRepository<UserPreferencesDocument, String> {
    fun findByEmail(email: String): UserPreferencesDocument?
}
