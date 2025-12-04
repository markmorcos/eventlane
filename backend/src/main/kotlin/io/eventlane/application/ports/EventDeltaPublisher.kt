package io.eventlane.application.ports

import io.eventlane.domain.model.EventDelta

interface EventDeltaPublisher {
    fun publish(slug: String, deltas: List<EventDelta>)
}
