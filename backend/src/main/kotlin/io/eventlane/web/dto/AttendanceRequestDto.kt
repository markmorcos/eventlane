package io.eventlane.web.dto

data class AttendanceRequestDto(
    val name: String,
    val language: String = "en",
)
