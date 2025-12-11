package io.eventlane.web.dto

data class UpdateEventMetadataRequestDto(
    val eventDate: String? = null,
    val timezone: String? = null,
    val location: LocationDto? = null,
    val clearLocation: Boolean? = null,
    val description: String? = null,
)
