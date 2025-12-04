package io.eventlane.web.dto

data class EventResponseDto(
    val slug: String,
    val title: String,
    val capacity: Int,
    val confirmedCount: Int,
    val waitlistCount: Int,
    val isAdmin: Boolean,
    val confirmed: List<AttendeeDto>?,
    val waitlist: List<AttendeeDto>?,
    val admins: List<String>?,
)
