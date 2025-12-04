package io.eventlane.web

import io.eventlane.auth.SecurityUser
import io.eventlane.domain.RsvpService
import io.eventlane.web.dto.DtoMapper
import io.eventlane.web.dto.RsvpRequestDTO
import io.eventlane.web.dto.RsvpResponseDTO
import io.eventlane.websocket.EventWebSocketPublisher
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/events/{slug}")
class RsvpController(
    private val rsvpService: RsvpService,
    private val wsPublisher: EventWebSocketPublisher,
) {

    @PostMapping("/rsvp")
    fun rsvp(
        @PathVariable slug: String,
        @RequestBody request: RsvpRequestDTO,
        @AuthenticationPrincipal user: SecurityUser,
    ): RsvpResponseDTO {
        val result = rsvpService.rsvp(
            slug = slug,
            userId = user.uid,
            name = request.name,
            email = user.email,
        )

        wsPublisher.publishEventUpdate(slug)

        return RsvpResponseDTO(
            status = result.status,
            attendee = DtoMapper.toAttendeeDTO(result.attendee, result.status),
        )
    }

    @PostMapping("/cancel")
    fun cancel(@PathVariable slug: String, @AuthenticationPrincipal user: SecurityUser): Boolean {
        val result = rsvpService.cancel(slug, user.email)
        wsPublisher.publishEventUpdate(slug)
        return result
    }
}
