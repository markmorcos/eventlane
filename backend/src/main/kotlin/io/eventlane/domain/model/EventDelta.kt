package io.eventlane.domain.model

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import java.time.Instant

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type",
)
@JsonSubTypes(
    JsonSubTypes.Type(value = EventCreated::class, name = "EventCreated"),
    JsonSubTypes.Type(value = EventCapacityUpdated::class, name = "EventCapacityUpdated"),
    JsonSubTypes.Type(value = AttendeeAdded::class, name = "AttendeeAdded"),
    JsonSubTypes.Type(value = AttendeeRemoved::class, name = "AttendeeRemoved"),
    JsonSubTypes.Type(value = AttendeeStatusChanged::class, name = "AttendeeStatusChanged"),
    JsonSubTypes.Type(value = AdminAdded::class, name = "AdminAdded"),
    JsonSubTypes.Type(value = AdminRemoved::class, name = "AdminRemoved"),
)
sealed class EventDelta(
    open val version: Long,
    open val timestamp: Instant,
    open val eventSlug: String,
)

data class EventCreated(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val title: String,
    val capacity: Int,
) : EventDelta(version, timestamp, eventSlug)

data class EventCapacityUpdated(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val oldCapacity: Int,
    val newCapacity: Int,
) : EventDelta(version, timestamp, eventSlug)

data class AttendeeAdded(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val attendee: Attendee,
    val status: AttendeeStatus,
) : EventDelta(version, timestamp, eventSlug)

data class AttendeeRemoved(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val attendeeEmail: String,
) : EventDelta(version, timestamp, eventSlug)

data class AttendeeStatusChanged(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val attendeeEmail: String,
    val oldStatus: AttendeeStatus,
    val newStatus: AttendeeStatus,
) : EventDelta(version, timestamp, eventSlug)

data class AdminAdded(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val adminEmail: String,
) : EventDelta(version, timestamp, eventSlug)

data class AdminRemoved(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val adminEmail: String,
) : EventDelta(version, timestamp, eventSlug)
