package io.eventlane.domain.model

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import java.time.Instant

// Common interface for all deltas
interface Delta {
    val type: String
    val version: Long
    val timestamp: Instant
}

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type",
)
@JsonSubTypes(
    JsonSubTypes.Type(value = EventCreated::class, name = "EventCreated"),
    JsonSubTypes.Type(value = EventCapacityUpdated::class, name = "EventCapacityUpdated"),
    JsonSubTypes.Type(value = EventDeleted::class, name = "EventDeleted"),
    JsonSubTypes.Type(value = AttendeeAdded::class, name = "AttendeeAdded"),
    JsonSubTypes.Type(value = AttendeeRemoved::class, name = "AttendeeRemoved"),
    JsonSubTypes.Type(value = AttendeeStatusChanged::class, name = "AttendeeStatusChanged"),
    JsonSubTypes.Type(value = AdminAdded::class, name = "AdminAdded"),
    JsonSubTypes.Type(value = AdminRemoved::class, name = "AdminRemoved"),
    JsonSubTypes.Type(value = EventDateTimeUpdated::class, name = "EventDateTimeUpdated"),
    JsonSubTypes.Type(value = EventLocationUpdated::class, name = "EventLocationUpdated"),
    JsonSubTypes.Type(value = EventDescriptionUpdated::class, name = "EventDescriptionUpdated"),
    JsonSubTypes.Type(value = EventCoverImageUpdated::class, name = "EventCoverImageUpdated"),
    JsonSubTypes.Type(value = EventSeriesCreated::class, name = "EventSeriesCreated"),
    JsonSubTypes.Type(value = EventSeriesUpdated::class, name = "EventSeriesUpdated"),
    JsonSubTypes.Type(value = EventSeriesDeleted::class, name = "EventSeriesDeleted"),
)
sealed class EventDelta(
    override val version: Long,
    override val timestamp: Instant,
    open val eventSlug: String,
) : Delta {
    override val type: String get() = this::class.simpleName ?: "Unknown"
}

data class EventCreated(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val capacity: Int,
    val eventDate: Instant,
    val timezone: String,
) : EventDelta(version, timestamp, eventSlug)

data class EventCapacityUpdated(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val oldCapacity: Int,
    val newCapacity: Int,
) : EventDelta(version, timestamp, eventSlug)

data class EventDeleted(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
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

data class EventDateTimeUpdated(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val eventDate: Instant,
    val timezone: String,
) : EventDelta(version, timestamp, eventSlug)

data class EventLocationUpdated(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val location: Location?,
) : EventDelta(version, timestamp, eventSlug)

data class EventDescriptionUpdated(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val description: String?,
) : EventDelta(version, timestamp, eventSlug)

data class EventCoverImageUpdated(
    override val version: Long,
    override val timestamp: Instant,
    override val eventSlug: String,
    val coverImages: Map<String, String>?,
) : EventDelta(version, timestamp, eventSlug)

// EventSeries delta types
data class EventSeriesCreated(
    override val version: Long,
    override val timestamp: Instant,
    val seriesSlug: String,
    val slug: String,
    val title: String,
    val anchorDate: Long,
    val timezone: String,
    val interval: String?,
    val leadWeeks: Int,
    val endDate: Long?,
    val createdAt: Long,
    val createdBy: String,
) : Delta {
    override val type: String = "EventSeriesCreated"
}

data class EventSeriesUpdated(
    override val version: Long,
    override val timestamp: Instant,
    val seriesSlug: String,
    val slug: String,
    val title: String?,
    val interval: String?,
    val leadWeeks: Int?,
    val endDate: Long?,
) : Delta {
    override val type: String = "EventSeriesUpdated"
}

data class EventSeriesDeleted(
    override val version: Long,
    override val timestamp: Instant,
    val seriesSlug: String,
    val slug: String,
) : Delta {
    override val type: String = "EventSeriesDeleted"
}
