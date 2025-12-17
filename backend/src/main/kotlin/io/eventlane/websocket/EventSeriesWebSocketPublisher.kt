package io.eventlane.websocket

import com.fasterxml.jackson.databind.ObjectMapper
import io.eventlane.domain.model.Delta
import io.eventlane.domain.model.EventSeries
import io.eventlane.domain.model.EventSeriesCreated
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component

@Component
class EventSeriesWebSocketPublisher(
    private val messageTemplate: SimpMessagingTemplate,
    private val objectMapper: ObjectMapper,
) {

    fun publishSeriesDeltas(series: EventSeries, deltas: List<Delta>) {
        if (deltas.isEmpty()) return

        val json = objectMapper.writeValueAsString(deltas)

        // Publish to series-specific topic
        messageTemplate.convertAndSend("/topic/series/${series.slug}", json)

        // Publish to affected users
        val affectedUsers = getAffectedUsers(series, deltas)
        affectedUsers.forEach { userEmail ->
            messageTemplate.convertAndSend("/topic/users/$userEmail", json)
        }
    }

    private fun getAffectedUsers(series: EventSeries, deltas: List<Delta>): Set<String> {
        val users = mutableSetOf<String>()

        users.add(series.creatorEmail)
        users.addAll(series.admins)

        deltas.forEach { delta ->
            when (delta) {
                is EventSeriesCreated -> users.add(delta.createdBy)
                else -> {}
            }
        }

        return users
    }
}
