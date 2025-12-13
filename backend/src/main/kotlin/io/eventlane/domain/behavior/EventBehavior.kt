package io.eventlane.domain.behavior

import io.eventlane.domain.model.Attendee
import io.eventlane.domain.model.AttendeeAdded
import io.eventlane.domain.model.AttendeeRemoved
import io.eventlane.domain.model.AttendeeStatus
import io.eventlane.domain.model.AttendeeStatusChanged
import io.eventlane.domain.model.BadRequestException
import io.eventlane.domain.model.Event
import io.eventlane.domain.model.EventCapacityUpdated
import io.eventlane.domain.model.EventDelta
import io.eventlane.domain.model.NotFoundException
import java.time.Instant
import kotlin.math.min

object EventBehavior {
    fun addAttendee(event: Event, name: String, email: String): Pair<Event, EventDelta> {
        val normalized = email.lowercase()
        val now = Instant.now()

        event.findAttendeeByEmail(normalized)?.let { existing ->
            return event to AttendeeAdded(
                version = event.version ?: 0L,
                timestamp = now,
                eventSlug = event.slug,
                attendee = existing,
                status = existing.status,
            )
        }

        val newAttendee = Attendee(
            name = name,
            email = normalized,
            status = AttendeeStatus.CONFIRMED,
            joinedAt = now,
        )

        val (updatedEvent, status) = event.addAttendee(newAttendee)

        val attendee =
            updatedEvent.findAttendeeByEmail(normalized)
                ?: throw NotFoundException("Attendee with email $normalized not found after addition")

        return updatedEvent to AttendeeAdded(
            version = event.version ?: 0L,
            timestamp = now,
            eventSlug = event.slug,
            attendee = attendee,
            status = status,
        )
    }

    fun removeAttendee(event: Event, email: String): Pair<Event, List<EventDelta>> {
        val normalized = email.lowercase()
        val now = Instant.now()

        val deltas = mutableListOf<EventDelta>()

        val attendee = event.findAttendeeByEmail(normalized)
            ?: throw NotFoundException("Attendee not found: $email")

        val (updatedEvent, promotedAttendee) = event.removeAttendee(attendee)

        deltas += AttendeeRemoved(
            version = event.version ?: 0L,
            timestamp = now,
            eventSlug = event.slug,
            attendeeEmail = attendee.email,
        )

        promotedAttendee?.let {
            deltas += AttendeeStatusChanged(
                version = event.version ?: 0L,
                timestamp = now,
                eventSlug = event.slug,
                attendeeEmail = it.email,
                oldStatus = AttendeeStatus.WAITLISTED,
                newStatus = AttendeeStatus.CONFIRMED,
            )
        }

        return updatedEvent to deltas
    }

    fun updateCapacity(event: Event, newCapacity: Int): Pair<Event, List<EventDelta>> {
        if (newCapacity < 0) {
            throw BadRequestException("Capacity cannot be negative")
        }

        val now = Instant.now()
        val deltas = mutableListOf<EventDelta>()

        if (newCapacity == event.capacity) {
            return event to emptyList()
        }

        val oldCapacity = event.capacity
        val currentConfirmed = event.confirmedList.size

        deltas += EventCapacityUpdated(
            version = event.version ?: 0L,
            timestamp = now,
            eventSlug = event.slug,
            oldCapacity = oldCapacity,
            newCapacity = newCapacity,
        )

        if (newCapacity > currentConfirmed) {
            val slotsToFill = newCapacity - currentConfirmed
            val waitlisted = event.waitingList.sortedBy { it.joinedAt }
            val toPromoteCount = min(slotsToFill, waitlisted.size)

            val toPromote = waitlisted.take(toPromoteCount)

            toPromote.forEach { attendee ->
                deltas += AttendeeStatusChanged(
                    version = event.version ?: 0L,
                    timestamp = now,
                    eventSlug = event.slug,
                    attendeeEmail = attendee.email,
                    oldStatus = AttendeeStatus.WAITLISTED,
                    newStatus = AttendeeStatus.CONFIRMED,
                )
            }

            val updatedAttendees = event.attendees.map { attendee ->
                if (toPromote.any { it.email == attendee.email }) {
                    attendee.copy(status = AttendeeStatus.CONFIRMED)
                } else {
                    attendee
                }
            }

            val updatedEvent = event.copy(
                capacity = newCapacity,
                attendees = updatedAttendees,
                updatedAt = now,
            )

            return updatedEvent to deltas
        }

        val demotionsNeeded = currentConfirmed - newCapacity
        val confirmed = event.confirmedList.sortedByDescending { it.joinedAt }
        val toDemote = confirmed.take(demotionsNeeded)

        toDemote.forEach { attendee ->
            deltas += AttendeeStatusChanged(
                version = event.version ?: 0L,
                timestamp = now,
                eventSlug = event.slug,
                attendeeEmail = attendee.email,
                oldStatus = AttendeeStatus.CONFIRMED,
                newStatus = AttendeeStatus.WAITLISTED,
            )
        }

        val updatedAttendees = event.attendees.map { attendee ->
            if (toDemote.any { it.email == attendee.email }) {
                attendee.copy(status = AttendeeStatus.WAITLISTED)
            } else {
                attendee
            }
        }

        val updatedEvent = event.copy(
            capacity = newCapacity,
            attendees = updatedAttendees,
            updatedAt = now,
        )

        return updatedEvent to deltas
    }
}
