package io.eventlane.persistence.repository

import io.eventlane.application.ports.UserPreferencesRepository
import io.eventlane.domain.model.UserPreferences
import io.eventlane.persistence.mapper.UserPreferencesPersistenceMapper
import org.springframework.stereotype.Component

@Component
class MongoUserPreferencesRepository(
    private val springDataRepository: SpringDataUserPreferencesRepository,
) : UserPreferencesRepository {

    override fun findByEmail(email: String): UserPreferences? {
        val document = springDataRepository.findByEmail(email) ?: return null
        return UserPreferencesPersistenceMapper.toDomain(document)
    }

    override fun save(preferences: UserPreferences): UserPreferences {
        val document = UserPreferencesPersistenceMapper.toDocument(preferences)
        val saved = springDataRepository.save(document)
        return UserPreferencesPersistenceMapper.toDomain(saved)
    }
}
