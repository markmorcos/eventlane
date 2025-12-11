package io.eventlane.web.dto

data class UpdateEventMetadataRequestDto(
    val location: LocationDto? = null,
    val description: String? = null,
)
