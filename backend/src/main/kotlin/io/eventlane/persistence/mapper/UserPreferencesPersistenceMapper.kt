package io.eventlane.persistence.mapper

import io.eventlane.domain.model.UserPreferences
import io.eventlane.persistence.document.UserPreferencesDocument

object UserPreferencesPersistenceMapper {
    fun toDomain(document: UserPreferencesDocument): UserPreferences {
        return UserPreferences(
            email = document.email,
            language = document.language,
            createdAt = document.createdAt,
            updatedAt = document.updatedAt,
            version = document.version,
        )
    }

    fun toDocument(domain: UserPreferences): UserPreferencesDocument {
        return UserPreferencesDocument(
            email = domain.email,
            language = domain.language,
            createdAt = domain.createdAt,
            updatedAt = domain.updatedAt,
            version = domain.version,
        )
    }
}
