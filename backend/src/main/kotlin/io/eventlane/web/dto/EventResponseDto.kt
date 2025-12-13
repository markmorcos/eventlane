package io.eventlane.web.dto

import io.eventlane.domain.model.AttendeeStatus

data class CoverImagesDto(
    val desktop: String,
    val mobile: String,
)

data class EventResponseDto(
    val slug: String,
    val title: String,
    val capacity: Int,
    val eventDate: Long,
    val timezone: String,
    val location: LocationDto?,
    val description: String?,
    val coverImages: CoverImagesDto?,
    val confirmedCount: Int,
    val waitlistedCount: Int,
    val requesterStatus: AttendeeStatus?,
    val creatorEmail: String,
    val isAdmin: Boolean,
    val seriesSlug: String,
    val confirmed: List<AttendeeDto>?,
    val waitlisted: List<AttendeeDto>?,
    val admins: List<String>?,
    val createdAt: Long,
    val version: Long,
)
