package io.eventlane.web.dto

import io.eventlane.application.service.ImageStorageService
import io.eventlane.domain.model.Attendee
import io.eventlane.domain.model.AttendeeStatus
import io.eventlane.domain.model.Event
import io.eventlane.domain.model.Location

object DtoMapper {
    fun toAttendeeDto(a: Attendee): AttendeeDto = AttendeeDto(
        email = a.email,
        name = a.name,
        createdAt = a.createdAt.toString(),
    )

    fun toLocationDto(location: Location): LocationDto = LocationDto(
        streetNumber = location.streetNumber,
        street = location.street,
        additional = location.additional,
        neighborhood = location.neighborhood,
        city = location.city,
        state = location.state,
        postalCode = location.postalCode,
        country = location.country,
        countryCode = location.countryCode,
        lat = location.lat,
        lng = location.lng,
        formatted = location.formatted,
    )

    fun fromLocationDto(dto: LocationDto): Location = Location(
        streetNumber = dto.streetNumber,
        street = dto.street,
        additional = dto.additional,
        neighborhood = dto.neighborhood,
        city = dto.city,
        state = dto.state,
        postalCode = dto.postalCode,
        country = dto.country,
        countryCode = dto.countryCode,
        lat = dto.lat,
        lng = dto.lng,
        formatted = dto.formatted,
    )

    fun toEventResponse(event: Event, requesterEmail: String, imageService: ImageStorageService): EventResponseDto {
        val isAdmin = event.isAdmin(requesterEmail.lowercase())
        val status = when {
            event.confirmedList.any { it.email == requesterEmail.lowercase() } -> AttendeeStatus.CONFIRMED
            event.waitingList.any { it.email == requesterEmail.lowercase() } -> AttendeeStatus.WAITLISTED
            else -> null
        }

        val coverImages = if (event.coverImageUrl != null) {
            CoverImagesDto(
                desktop = imageService.getPublicImageUrl(event.slug, "desktop"),
                mobile = imageService.getPublicImageUrl(event.slug, "mobile"),
            )
        } else {
            null
        }

        return EventResponseDto(
            slug = event.slug,
            title = event.title,
            capacity = event.capacity,
            eventDate = event.eventDate.toEpochMilli(),
            timezone = event.timezone,
            location = event.location?.let { toLocationDto(it) },
            description = event.description,
            coverImages = coverImages,
            confirmedCount = event.confirmedList.size,
            waitlistedCount = event.waitingList.size,
            creatorEmail = event.creatorEmail,
            isAdmin = isAdmin,
            requesterStatus = status,

            confirmed = if (isAdmin) event.confirmedList.map { toAttendeeDto(it) } else null,
            waitlisted = if (isAdmin) event.waitingList.map { toAttendeeDto(it) } else null,
            admins = if (isAdmin) event.admins else null,

            createdAt = event.createdAt.toEpochMilli(),
            version = event.version ?: 0L,
        )
    }
}
