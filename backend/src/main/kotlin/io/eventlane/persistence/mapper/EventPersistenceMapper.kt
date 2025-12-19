package io.eventlane.persistence.mapper

import io.eventlane.domain.model.Attendee
import io.eventlane.domain.model.Event
import io.eventlane.domain.model.Location
import io.eventlane.persistence.document.AttendeeDocument
import io.eventlane.persistence.document.EventDocument
import io.eventlane.persistence.document.LocationDocument

object EventPersistenceMapper {
    fun toDomain(doc: EventDocument): Event = Event(
        id = doc.id!!,
        slug = doc.slug,
        capacity = doc.capacity,
        eventDate = doc.eventDate,
        timezone = doc.timezone,
        location = doc.location?.let { toDomainLocation(it) },
        description = doc.description,
        coverImageUrl = doc.coverImageUrl,
        attendees = doc.attendees.map { toDomainAttendee(it) },
        seriesId = doc.seriesId,
        deletedAt = doc.deletedAt,
        createdAt = doc.createdAt,
        updatedAt = doc.updatedAt,
        version = doc.version,
    )

    fun toDocument(domain: Event): EventDocument = EventDocument(
        id = domain.id,
        slug = domain.slug,
        capacity = domain.capacity,
        eventDate = domain.eventDate,
        timezone = domain.timezone,
        location = domain.location?.let { toDocumentLocation(it) },
        description = domain.description,
        coverImageUrl = domain.coverImageUrl,
        seriesId = domain.seriesId,
        deletedAt = domain.deletedAt,
        attendees = domain.attendees.map { toDocumentAttendee(it) },
        createdAt = domain.createdAt,
        updatedAt = domain.updatedAt,
        version = domain.version,
    )

    fun toDomainAttendee(doc: AttendeeDocument): Attendee = Attendee(
        name = doc.name,
        email = doc.email,
        status = io.eventlane.domain.model.AttendeeStatus.valueOf(doc.status),
        joinedAt = doc.joinedAt,
        language = doc.language,
    )

    fun toDocumentAttendee(attendee: Attendee): AttendeeDocument = AttendeeDocument(
        name = attendee.name,
        email = attendee.email,
        status = attendee.status.name,
        joinedAt = attendee.joinedAt,
        language = attendee.language,
    )

    fun toDomainLocation(doc: LocationDocument): Location = Location(
        streetNumber = doc.streetNumber,
        street = doc.street,
        additional = doc.additional,
        neighborhood = doc.neighborhood,
        city = doc.city,
        state = doc.state,
        postalCode = doc.postalCode,
        country = doc.country,
        countryCode = doc.countryCode,
        lat = doc.lat,
        lng = doc.lng,
        formatted = doc.formatted,
        placeId = doc.placeId,
    )

    fun toDocumentLocation(location: Location): LocationDocument = LocationDocument(
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
}
