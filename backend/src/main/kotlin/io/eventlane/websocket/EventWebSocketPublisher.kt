package io.eventlane.websocket

import io.eventlane.application.ports.EventDeltaPublisher
import io.eventlane.domain.model.EventDelta
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component

@Component
class EventWebSocketPublisher(
    private val messageTemplate: SimpMessagingTemplate,
) : EventDeltaPublisher {

    override fun publish(slug: String, deltas: List<EventDelta>) {
        if (deltas.isEmpty()) return
        messageTemplate.convertAndSend("/topic/events/$slug", deltas)
    }
}
