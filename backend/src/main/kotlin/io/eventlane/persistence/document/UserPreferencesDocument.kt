package io.eventlane.persistence.document

import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("user_preferences")
data class UserPreferencesDocument(
    @Indexed(unique = true) val email: String,

    val language: String = "de",

    val createdAt: Instant,
    val updatedAt: Instant,

    @Version val version: Long? = null,
)
