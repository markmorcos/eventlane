package io.eventlane.web.dto

import io.eventlane.application.service.ImageStorageService
import io.eventlane.domain.model.Attendee
import io.eventlane.domain.model.AttendeeStatus
import io.eventlane.domain.model.Event
import io.eventlane.domain.model.EventSeries
import io.eventlane.domain.model.Location

object DtoMapper {
    fun toAttendeeDto(a: Attendee): AttendeeDto = AttendeeDto(
        email = a.email,
        name = a.name,
        createdAt = a.joinedAt.toString(),
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
        placeId = location.placeId,
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
        placeId = dto.placeId,
    )

    fun toEventResponse(
        event: Event,
        series: EventSeries,
        requesterEmail: String,
        imageService: ImageStorageService,
    ): EventResponseDto {
        val isAdmin = series.isAdmin(requesterEmail.lowercase())
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
            title = series.title,
            capacity = event.capacity,
            eventDate = event.eventDate.toEpochMilli(),
            timezone = event.timezone,
            location = event.location?.let { toLocationDto(it) },
            description = event.description,
            coverImages = coverImages,
            confirmedCount = event.confirmedList.size,
            waitlistedCount = event.waitingList.size,
            creatorEmail = series.creatorEmail,
            isAdmin = isAdmin,
            seriesSlug = series.slug,
            requesterStatus = status,

            confirmed = if (isAdmin) event.confirmedList.map { toAttendeeDto(it) } else null,
            waitlisted = if (isAdmin) event.waitingList.map { toAttendeeDto(it) } else null,
            admins = if (isAdmin) series.admins else null,

            createdAt = event.createdAt.toEpochMilli(),
            version = event.version ?: 0L,
        )
    }

    fun toEventSeriesResponseDto(series: EventSeries): EventSeriesResponseDto = EventSeriesResponseDto(
        slug = series.slug,
        title = series.title,
        interval = series.interval?.toString(),
        leadWeeks = series.leadWeeks,
        autoGenerate = series.autoGenerate,
        anchorDate = series.anchorDate,
        endDate = series.endDate,
        nextEventDate = null,
        nextEventSlug = null,
        upcomingEventsCount = 0,
        creatorEmail = series.creatorEmail,
        admins = series.admins,
        createdAt = series.createdAt,
        updatedAt = series.updatedAt,
    )
}
