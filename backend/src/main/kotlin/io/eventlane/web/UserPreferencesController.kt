package io.eventlane.web

import io.eventlane.application.ports.UserPreferencesRepository
import io.eventlane.auth.SecurityUser
import io.eventlane.domain.model.UserPreferences
import io.eventlane.web.dto.UpdateUserPreferencesRequestDto
import io.eventlane.web.dto.UserPreferencesDto
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/api/user")
class UserPreferencesController(
    private val repository: UserPreferencesRepository,
) {

    @GetMapping("/preferences")
    fun getPreferences(@AuthenticationPrincipal user: SecurityUser): UserPreferencesDto {
        val preferences = repository.findByEmail(user.email)
            ?: createDefaultPreferences(user.email)

        return UserPreferencesDto(language = preferences.language)
    }

    @PatchMapping("/preferences")
    fun updatePreferences(
        @RequestBody request: UpdateUserPreferencesRequestDto,
        @AuthenticationPrincipal user: SecurityUser,
    ): UserPreferencesDto {
        val now = Instant.now()
        val existing = repository.findByEmail(user.email)

        val updated = if (existing != null) {
            existing.copy(
                language = request.language,
                updatedAt = now,
            )
        } else {
            UserPreferences(
                email = user.email,
                language = request.language,
                createdAt = now,
                updatedAt = now,
            )
        }

        val saved = repository.save(updated)
        return UserPreferencesDto(language = saved.language)
    }

    private fun createDefaultPreferences(email: String): UserPreferences {
        val now = Instant.now()
        return repository.save(
            UserPreferences(
                email = email,
                language = "de",
                createdAt = now,
                updatedAt = now,
            ),
        )
    }
}
