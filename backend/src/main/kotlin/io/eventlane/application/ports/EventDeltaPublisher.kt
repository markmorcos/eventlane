package io.eventlane.application.ports

import io.eventlane.domain.model.Event
import io.eventlane.domain.model.EventDelta

interface EventDeltaPublisher {
    fun publish(event: Event, deltas: List<EventDelta>)
}
