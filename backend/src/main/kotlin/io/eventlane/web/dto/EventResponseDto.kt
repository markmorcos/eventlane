package io.eventlane.web.dto

import io.eventlane.domain.model.AttendeeStatus

data class EventResponseDto(
    val slug: String,
    val title: String,
    val capacity: Int,
    val confirmedCount: Int,
    val waitlistedCount: Int,
    val requesterStatus: AttendeeStatus?,
    val creatorEmail: String,
    val isAdmin: Boolean,
    val confirmed: List<AttendeeDto>?,
    val waitlisted: List<AttendeeDto>?,
    val admins: List<String>?,
)
