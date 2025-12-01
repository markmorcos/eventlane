package io.eventlane.websocket

import com.corundumstudio.socketio.SocketIOServer
import io.eventlane.domain.EventService
import io.eventlane.web.dto.DtoMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class EventWebSocketPublisher(
    private val socketIOServer: SocketIOServer,
    private val eventService: EventService
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    
    fun publishEventUpdate(slug: String) {
        try {
            val event = eventService.getEventBySlug(slug)
            val roomName = "event:${event.id}"
            
            val roomOps = socketIOServer.getRoomOperations(roomName)
            val clientsInRoom = roomOps.clients
            logger.info("Publishing to room '$roomName' - Total connected clients: ${socketIOServer.allClients.size}, Clients in room: ${clientsInRoom.size}")
            
            // Publish summary update
            val summaryDto = DtoMapper.toEventSummaryDTO(event, false)
            roomOps.sendEvent("event:summary", summaryDto)
            logger.info("Published summary update to room '$roomName' for event $slug")
            
            // Publish attendees update
            val attendeesDto = DtoMapper.toAttendeesDTO(event)
            roomOps.sendEvent("event:attendees", attendeesDto)
            logger.info("Published attendees update to room '$roomName' for event $slug")
            
            // Debug: log client session IDs in room
            clientsInRoom.forEach { client ->
                logger.debug("Client in room: ${client.sessionId}")
            }
        } catch (e: Exception) {
            logger.error("Failed to publish WebSocket update for event $slug", e)
        }
    }
    
    fun publishEventDeleted(slug: String) {
        try {
            val message = mapOf("deleted" to true, "slug" to slug)
            socketIOServer.broadcastOperations.sendEvent("event:deleted", message)
            logger.debug("Published deletion notification for event $slug")
        } catch (e: Exception) {
            logger.error("Failed to publish deletion notification for event $slug", e)
        }
    }
}
