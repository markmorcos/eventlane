package io.eventlane.web.dto

data class UserPreferencesDto(
    val language: String,
)

data class UpdateUserPreferencesRequestDto(
    val language: String,
)
