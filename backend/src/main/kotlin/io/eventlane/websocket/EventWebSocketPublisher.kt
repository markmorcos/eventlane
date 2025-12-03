package io.eventlane.websocket

import io.eventlane.domain.EventService
import io.eventlane.web.dto.DtoMapper
import org.slf4j.LoggerFactory
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component

@Component
class EventWebSocketPublisher(
    private val messagingTemplate: SimpMessagingTemplate,
    private val eventService: EventService
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    
    fun publishEventUpdate(slug: String) {
        try {
            val event = eventService.getEventBySlug(slug)
            val eventId = event.id
            
            logger.info("Publishing update for event $slug (ID: $eventId)")

            val detailsDto = DtoMapper.toEventDetailDTO(event, false)
            messagingTemplate.convertAndSend("/topic/event/$eventId/details", detailsDto)
            logger.info("Published details update for event $slug")
            
            val summaryDto = DtoMapper.toEventSummaryDTO(event)
            messagingTemplate.convertAndSend("/topic/event/$eventId/summary", summaryDto)
            logger.info("Published summary update for event $slug")
            
            val attendeesDto = DtoMapper.toAttendeesDTO(event)
            messagingTemplate.convertAndSend("/topic/event/$eventId/attendees", attendeesDto)
            logger.info("Published attendees update for event $slug")

            val adminsDto = DtoMapper.toAdminsDTO(event)
            messagingTemplate.convertAndSend("/topic/event/$eventId/admins", adminsDto)
            logger.info("Published admins update for event $slug")
        } catch (e: Exception) {
            logger.error("Failed to publish WebSocket update for event $slug", e)
        }
    }
    
    fun publishEventDeleted(slug: String) {
        try {
            val message = mapOf("deleted" to true, "slug" to slug)
            messagingTemplate.convertAndSend("/topic/events", message)
            logger.info("Published deletion notification for event $slug")
        } catch (e: Exception) {
            logger.error("Failed to publish deletion notification for event $slug", e)
        }
    }
}
