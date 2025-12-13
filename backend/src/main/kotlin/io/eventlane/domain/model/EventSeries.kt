package io.eventlane.domain.model

import java.time.Duration
import java.time.Instant

data class EventSeries(
    val id: String? = null,
    val slug: String,
    val title: String,
    val interval: Duration? = null,
    val leadWeeks: Int = 0,
    val autoGenerate: Boolean = false,
    val endDate: Instant? = null,
    val creatorEmail: String,
    val admins: List<String> = emptyList(),
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now(),
    val version: Long? = null,
) {
    fun isAdmin(email: String) = email == creatorEmail || admins.contains(email)

    fun isOneOff(): Boolean = interval == null

    fun isRecurring(): Boolean = interval != null && autoGenerate
}
