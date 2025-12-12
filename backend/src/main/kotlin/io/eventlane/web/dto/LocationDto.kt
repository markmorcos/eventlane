package io.eventlane.web.dto

data class LocationDto(
    val streetNumber: String? = null,
    val street: String? = null,
    val additional: String? = null,
    val neighborhood: String? = null,
    val city: String? = null,
    val state: String? = null,
    val postalCode: String? = null,
    val country: String? = null,
    val countryCode: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val formatted: String,
    val placeId: String? = null,
)
