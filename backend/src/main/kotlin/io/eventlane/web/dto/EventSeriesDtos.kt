package io.eventlane.web.dto

import java.time.Instant

data class CreateEventSeriesRequestDto(
    val title: String,
    val capacity: Int,
    val firstEventDate: Instant,
    val timezone: String,
    val interval: String?,
    val leadWeeks: Int,
    val autoGenerate: Boolean,
    val endDate: Instant?,
)

data class UpdateEventSeriesRequestDto(
    val anchorDate: Instant? = null,
    val timezone: String? = null,
    val interval: String? = null,
    val leadWeeks: Int? = null,
    val autoGenerate: Boolean? = null,
    val endDate: Instant? = null,
)

data class CreateEventForSeriesRequestDto(
    val capacity: Int,
    val eventDate: Instant,
    val timezone: String,
)

data class EventSeriesResponseDto(
    val slug: String,
    val title: String,
    val interval: String?,
    val leadWeeks: Int,
    val autoGenerate: Boolean,
    val anchorDate: Instant,
    val timezone: String,
    val endDate: Instant?,
    val nextEventDate: Instant?,
    val nextEventSlug: String?,
    val upcomingEventsCount: Int,
    val creatorEmail: String,
    val admins: List<String>,
    val createdAt: Instant,
    val updatedAt: Instant,
)
