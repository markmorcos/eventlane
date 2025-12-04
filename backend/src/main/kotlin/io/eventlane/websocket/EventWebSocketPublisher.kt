package io.eventlane.websocket

import io.eventlane.domain.EventService
import io.eventlane.web.dto.DtoMapper
import org.slf4j.LoggerFactory
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component

@Component
class EventWebSocketPublisher(
    private val messagingTemplate: SimpMessagingTemplate,
    private val eventService: EventService,
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun publishEventUpdate(slug: String) {
        try {
            val event = eventService.getEventBySlug(slug)

            logger.info("Publishing update for event $slug")

            val detailsDto = DtoMapper.toEventDetailDTO(event, false)
            messagingTemplate.convertAndSend("/topic/event/$slug/details", detailsDto)
            logger.info("Published details update for event $slug")

            val summaryDto = DtoMapper.toEventSummaryDTO(event)
            messagingTemplate.convertAndSend("/topic/event/$slug/summary", summaryDto)
            logger.info("Published summary update for event $slug")

            val attendeesDto = DtoMapper.toAttendeesDTO(event)
            messagingTemplate.convertAndSend("/topic/event/$slug/attendees", attendeesDto)
            logger.info("Published attendees update for event $slug")

            val adminsDto = DtoMapper.toAdminsDTO(event)
            messagingTemplate.convertAndSend("/topic/event/$slug/admins", adminsDto)
            logger.info("Published admins update for event $slug")
        } catch (e: Exception) {
            logger.error("Failed to publish WebSocket update for event $slug", e)
        }
    }

    fun publishEventDeleted(slug: String) {
        try {
            messagingTemplate.convertAndSend("/topic/event/$slug/deleted", mapOf("slug" to slug))
            logger.info("Published deletion notification for event $slug")
        } catch (e: Exception) {
            logger.error("Failed to publish deletion notification for event $slug", e)
        }
    }

    fun publishAdminRemoved(slug: String, email: String) {
        try {
            messagingTemplate.convertAndSend("/topic/event/$slug/admin-removed", mapOf("email" to email))
            logger.info("Published admin removal notification for event $slug (email: $email)")
        } catch (e: Exception) {
            logger.error("Failed to publish admin removal notification for event $slug (email: $email)", e)
        }
    }
}
