package io.eventlane.domain.model

import java.time.Instant

data class UserPreferences(
    val email: String,
    val language: String = "de",
    val createdAt: Instant,
    val updatedAt: Instant,
    val version: Long? = null,
)
