package io.eventlane.domain.behavior

import io.eventlane.domain.model.AdminAdded
import io.eventlane.domain.model.AdminRemoved
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
    fun addAttendee(event: Event, userId: String, name: String, email: String): Pair<Event, EventDelta> {
        val normalized = email.lowercase()
        val now = Instant.now()

        event.findAttendeeByEmail(normalized)?.let { existing ->
            val status =
                if (event.confirmedList.any { it.email.equals(normalized, ignoreCase = true) }) {
                    AttendeeStatus.CONFIRMED
                } else {
                    AttendeeStatus.WAITLISTED
                }

            return event to AttendeeAdded(
                version = event.version ?: 0L,
                timestamp = now,
                eventSlug = event.slug,
                attendee = existing,
                status = status,
            )
        }

        val newAttendee = Attendee(
            userId = userId,
            name = name,
            email = normalized,
            createdAt = now,
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
            val toPromoteCount = min(slotsToFill, event.waitingList.size)

            val toPromote = event.waitingList.take(toPromoteCount)
            val remainingWaitlist = event.waitingList.drop(toPromoteCount)

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

            val updatedEvent = event.copy(
                capacity = newCapacity,
                confirmedList = event.confirmedList + toPromote,
                waitingList = remainingWaitlist,
                updatedAt = now,
            )

            return updatedEvent to deltas
        }

        val demotionsNeeded = currentConfirmed - newCapacity
        val toDemote = event.confirmedList.takeLast(demotionsNeeded)
        val remainingConfirmed = event.confirmedList.dropLast(demotionsNeeded)

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

        val updatedEvent = event.copy(
            capacity = newCapacity,
            confirmedList = remainingConfirmed,
            waitingList = toDemote + event.waitingList,
            updatedAt = now,
        )

        return updatedEvent to deltas
    }

    fun addAdmin(event: Event, email: String): Pair<Event, List<EventDelta>> {
        val normalized = email.lowercase()
        val now = Instant.now()

        val alreadyAdmin =
            event.creatorEmail.equals(normalized, ignoreCase = true) ||
                event.admins.any { it.equals(normalized, ignoreCase = true) }

        if (alreadyAdmin) {
            return event to emptyList()
        }

        val updatedEvent = event.copy(
            admins = event.admins + normalized,
            updatedAt = now,
        )

        val delta = AdminAdded(
            version = event.version ?: 0L,
            timestamp = now,
            eventSlug = event.slug,
            adminEmail = normalized,
        )

        return updatedEvent to listOf(delta)
    }

    fun removeAdmin(event: Event, email: String): Pair<Event, List<EventDelta>> {
        val normalized = email.lowercase()
        val now = Instant.now()

        if (event.creatorEmail.equals(normalized, ignoreCase = true)) {
            throw BadRequestException("Cannot remove the event creator from admins")
        }

        if (event.admins.none { it.equals(normalized, ignoreCase = true) }) {
            throw NotFoundException("Admin not found: $email")
        }

        val updatedEvent = event.copy(
            admins = event.admins.filterNot { it.equals(normalized, ignoreCase = true) },
            updatedAt = now,
        )

        val delta = AdminRemoved(
            version = event.version ?: 0L,
            timestamp = now,
            eventSlug = event.slug,
            adminEmail = normalized,
        )

        return updatedEvent to listOf(delta)
    }
}
