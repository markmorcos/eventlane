package io.eventlane.persistence.document

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("user_preferences")
data class UserPreferencesDocument(
    @Id val email: String,

    val language: String = "de",

    val createdAt: Instant,
    val updatedAt: Instant,

    @Version val version: Long? = null,
)
