package io.eventlane.websocket

import com.fasterxml.jackson.databind.ObjectMapper
import io.eventlane.application.ports.EventDeltaPublisher
import io.eventlane.domain.model.AdminRemoved
import io.eventlane.domain.model.AttendeeRemoved
import io.eventlane.domain.model.Event
import io.eventlane.domain.model.EventDelta
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component

@Component
class EventWebSocketPublisher(
    private val messageTemplate: SimpMessagingTemplate,
    private val objectMapper: ObjectMapper,
) : EventDeltaPublisher {

    override fun publish(event: Event, deltas: List<EventDelta>) {
        if (deltas.isEmpty()) return

        val listType = objectMapper.typeFactory
            .constructCollectionType(List::class.java, EventDelta::class.java)

        val json = objectMapper.writerFor(listType)
            .writeValueAsString(deltas)

        messageTemplate.convertAndSend("/topic/events/${event.slug}", json)

        val affectedUsers = getAffectedUsers(event, deltas)
        affectedUsers.forEach { userEmail ->
            messageTemplate.convertAndSend("/topic/users/$userEmail", json)
        }
    }

    private fun getAffectedUsers(event: Event, deltas: List<EventDelta>): Set<String> {
        val users = mutableSetOf<String>()

        users.add(event.creatorEmail)
        users.addAll(event.admins)
        users.addAll(event.confirmedList.map { it.email })
        users.addAll(event.waitingList.map { it.email })

        deltas.forEach { delta ->
            when (delta) {
                is AdminRemoved -> users.add(delta.adminEmail)
                is AttendeeRemoved -> users.add(delta.attendeeEmail)
                else -> {}
            }
        }

        return users
    }
}
