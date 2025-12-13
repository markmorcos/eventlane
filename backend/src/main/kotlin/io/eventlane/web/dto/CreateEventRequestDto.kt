package io.eventlane.web.dto

data class CreateEventRequestDto(
    val title: String,
    val capacity: Int,
    val eventDate: String,
    val timezone: String,
    val interval: String?, // ISO 8601 duration or null for one-off
    val leadWeeks: Int?,
    val endDate: String?,
)
