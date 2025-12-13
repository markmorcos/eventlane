package io.eventlane.application.ports

import io.eventlane.domain.model.UserPreferences

interface UserPreferencesRepository {
    fun findByEmail(email: String): UserPreferences?
    fun save(preferences: UserPreferences): UserPreferences
}
