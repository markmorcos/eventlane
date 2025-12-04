package io.eventlane.web

import io.eventlane.auth.SecurityUser
import io.eventlane.domain.AdminService
import io.eventlane.domain.CapacityService
import io.eventlane.domain.EventPermissionService
import io.eventlane.domain.EventService
import io.eventlane.web.dto.*
import io.eventlane.websocket.EventWebSocketPublisher
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
class AdminController(
    private val adminService: AdminService,
    private val capacityService: CapacityService,
    private val eventPermissionService: EventPermissionService,
    private val eventService: EventService,
    private val wsPublisher: EventWebSocketPublisher
) {
    
    @PostMapping("/events")
    fun createEvent(
        @RequestBody request: CreateEventRequestDTO,
        @AuthenticationPrincipal user: SecurityUser
    ): EventDetailDTO {
        val event = adminService.createEvent(
            AdminService.CreateEventRequest(
                title = request.title,
                slug = request.slug,
                capacity = request.capacity,
                adminEmails = request.adminEmails
            ),
            user.email
        )
        
        return DtoMapper.toEventDetailDTO(event, true)
    }
    
    @PatchMapping("/events/{slug}/capacity")
    fun updateCapacity(
        @PathVariable slug: String,
        @RequestBody request: UpdateCapacityRequestDTO,
        @AuthenticationPrincipal user: SecurityUser
    ): UpdateCapacityResponseDTO {
        val result = capacityService.updateCapacity(slug, request.capacity, user.email)
        
        wsPublisher.publishEventUpdate(slug)
        
        return UpdateCapacityResponseDTO(
            event = DtoMapper.toEventDetailDTO(result.event, true),
        )
    }
    
    @GetMapping("/events/{slug}/admins")
    fun getAdmins(
        @PathVariable slug: String,
        @AuthenticationPrincipal user: SecurityUser
    ): List<String> {
        return adminService.getAdmins(slug, user.email)
    }
    
    @PostMapping("/events/{slug}/admins")
    fun addAdmin(
        @PathVariable slug: String,
        @RequestBody request: AdminEmailRequestDTO,
        @AuthenticationPrincipal user: SecurityUser
    ) {
        adminService.addAdmin(slug, request.adminEmail, user.email)
        wsPublisher.publishEventUpdate(slug)
    }
    
    @DeleteMapping("/events/{slug}/admins/{email}")
    fun removeAdmin(
        @PathVariable slug: String,
        @PathVariable email: String,
        @AuthenticationPrincipal user: SecurityUser
    ) {
        adminService.removeAdmin(slug, email, user.email)
        wsPublisher.publishAdminRemoved(slug, email)
    }
    
    @DeleteMapping("/events/{slug}/attendees/{email}")
    fun removeAttendee(
        @PathVariable slug: String,
        @PathVariable email: String,
        @AuthenticationPrincipal user: SecurityUser
    ): Boolean {
        val result = adminService.removeAttendee(slug, email, user.email)
        
        wsPublisher.publishEventUpdate(slug)
        
        return result
    }
    
    @DeleteMapping("/events/{slug}")
    fun deleteEvent(
        @PathVariable slug: String,
        @AuthenticationPrincipal user: SecurityUser
    ) {
        adminService.deleteEvent(slug, user.email)
        wsPublisher.publishEventDeleted(slug)
    }
}
