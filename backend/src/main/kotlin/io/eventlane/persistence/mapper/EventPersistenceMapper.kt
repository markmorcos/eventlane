package io.eventlane.persistence.mapper

import io.eventlane.domain.model.Attendee
import io.eventlane.domain.model.Event
import io.eventlane.persistence.document.AttendeeDocument
import io.eventlane.persistence.document.EventDocument

object EventPersistenceMapper {
    fun toDomain(doc: EventDocument): Event = Event(
        id = doc.id!!,
        slug = doc.slug,
        title = doc.title,
        capacity = doc.capacity,
        confirmedList = doc.confirmedList.map { toDomainAttendee(it) },
        waitingList = doc.waitingList.map { toDomainAttendee(it) },
        creatorEmail = doc.creatorEmail,
        admins = doc.admins,
        createdAt = doc.createdAt,
        updatedAt = doc.updatedAt,
        version = doc.version,
    )

    fun toDocument(domain: Event): EventDocument = EventDocument(
        id = domain.id,
        slug = domain.slug,
        title = domain.title,
        capacity = domain.capacity,
        creatorEmail = domain.creatorEmail,
        admins = domain.admins,
        confirmedList = domain.confirmedList.map { toDocumentAttendee(it) },
        waitingList = domain.waitingList.map { toDocumentAttendee(it) },
        createdAt = domain.createdAt,
        updatedAt = domain.updatedAt,
        version = domain.version,
    )

    fun toDomainAttendee(doc: AttendeeDocument): Attendee = Attendee(
        name = doc.name,
        email = doc.email,
        createdAt = doc.createdAt,
    )

    fun toDocumentAttendee(attendee: Attendee): AttendeeDocument = AttendeeDocument(
        name = attendee.name,
        email = attendee.email,
        createdAt = attendee.createdAt,
    )
}
