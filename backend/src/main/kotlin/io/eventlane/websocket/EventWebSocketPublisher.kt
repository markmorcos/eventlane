package io.eventlane.websocket

import com.fasterxml.jackson.databind.ObjectMapper
import io.eventlane.application.ports.EventDeltaPublisher
import io.eventlane.domain.model.EventDelta
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component

@Component
class EventWebSocketPublisher(
    private val messageTemplate: SimpMessagingTemplate,
    private val objectMapper: ObjectMapper,
) : EventDeltaPublisher {

    override fun publish(slug: String, deltas: List<EventDelta>) {
        if (deltas.isEmpty()) return

        val listType = objectMapper.typeFactory
            .constructCollectionType(List::class.java, EventDelta::class.java)

        val json = objectMapper.writerFor(listType)
            .writeValueAsString(deltas)

        println("WS JSON: $json")

        messageTemplate.convertAndSend("/topic/events/$slug", json)
    }
}
