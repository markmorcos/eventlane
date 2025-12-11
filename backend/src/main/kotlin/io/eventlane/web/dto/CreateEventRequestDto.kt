package io.eventlane.web.dto

data class CreateEventRequestDto(
    val title: String,
    val capacity: Int,
    val eventDate: String,
    val timezone: String,
)
