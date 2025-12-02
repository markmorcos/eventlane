package io.eventlane.domain

import io.eventlane.persistence.Attendee
import io.eventlane.persistence.EventDocument
import io.eventlane.persistence.EventRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class AdminService(
    private val eventRepository: EventRepository,
    private val optimisticRetry: OptimisticRetry,
    private val eventPermissionService: EventPermissionService
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    
    data class CreateEventRequest(
        val title: String,
        val slug: String,
        val capacity: Int,
        val adminEmails: List<String>
    )
    
    data class RemoveAttendeeResult(
        val success: Boolean,
        val promoted: Attendee?
    )
    
    fun createEvent(request: CreateEventRequest, creatorEmail: String): EventDocument {
        if (eventRepository.existsBySlug(request.slug)) {
            throw ConflictException("Event with slug '${request.slug}' already exists")
        }
        
        if (request.capacity < 0) {
            throw BadRequestException("Capacity cannot be negative")
        }
        
        val admins = (request.adminEmails + creatorEmail)
            .map { it.lowercase() }
            .distinct()
            .toMutableList()
        
        val event = EventDocument(
            slug = request.slug,
            title = request.title,
            capacity = request.capacity,
            admins = admins
        )
        
        logger.debug("Creating new event: ${request.slug} with ${admins.size} admins")
        return eventRepository.save(event)
    }
    
    fun getAdmins(slug: String, requesterEmail: String): List<String> {
        eventPermissionService.requireAdmin(slug, requesterEmail)
        val event = eventRepository.findBySlug(slug)
            ?: throw NotFoundException("Event not found: $slug")
        return event.admins.toList()
    }
    
    fun addAdmin(slug: String, adminEmailToAdd: String, requesterEmail: String) {
        eventPermissionService.requireAdmin(slug, requesterEmail)
        
        optimisticRetry.doWithRetry(slug) { event ->
            val normalizedEmail = adminEmailToAdd.lowercase()
            if (!event.admins.contains(normalizedEmail)) {
                event.admins.add(normalizedEmail)
                logger.debug("Added admin $normalizedEmail to event $slug")
            }
        }
    }
    
    fun removeAdmin(slug: String, adminEmailToRemove: String, requesterEmail: String) {
        eventPermissionService.requireAdmin(slug, requesterEmail)
        
        optimisticRetry.doWithRetry(slug) { event ->
            val normalizedEmail = adminEmailToRemove.lowercase()

            if (event.admins[0] == normalizedEmail) {
                throw BadRequestException("Cannot remove the primary admin from an event")
            }
            
            if (event.admins.size == 1) {
                throw BadRequestException("Cannot remove the last admin from an event")
            }
            
            event.admins.remove(normalizedEmail)
            logger.debug("Removed admin $normalizedEmail from event $slug")
        }
    }
    
    fun removeAttendee(
        slug: String,
        attendeeId: String,
        promoteNext: Boolean,
        requesterEmail: String
    ): RemoveAttendeeResult {
        eventPermissionService.requireAdmin(slug, requesterEmail)
        
        return optimisticRetry.doWithRetry(slug) { event ->
            val confirmedAttendee = event.confirmedList.find { it.id == attendeeId }
            val waitlistedAttendee = event.waitingList.find { it.id == attendeeId }
            
            if (confirmedAttendee == null && waitlistedAttendee == null) {
                throw NotFoundException("Attendee not found: $attendeeId")
            }
            
            var promoted: Attendee? = null
            
            if (confirmedAttendee != null) {
                // Remove from confirmed list
                event.confirmedList.remove(confirmedAttendee)
                logger.debug("Admin removed confirmed attendee ${confirmedAttendee.userId} from event $slug")
                
                if (promoteNext && event.waitingList.isNotEmpty()) {
                    // Promote next person from waitlist
                    val nextInLine = event.waitingList.removeAt(0)
                    logger.debug("Promoting attendee ${nextInLine.userId} from waitlist to confirmed after admin removal")
                    event.confirmedList.add(nextInLine)
                    promoted = nextInLine
                }
            } else if (waitlistedAttendee != null) {
                // Remove from waiting list
                event.waitingList.remove(waitlistedAttendee)
                logger.debug("Admin removed waitlisted attendee ${waitlistedAttendee.userId} from event $slug")
            }
            
            RemoveAttendeeResult(true, promoted)
        }
    }
    
    fun deleteEvent(slug: String, requesterEmail: String) {
        eventPermissionService.requireAdmin(slug, requesterEmail)
        
        val event = eventRepository.findBySlug(slug)
            ?: throw NotFoundException("Event not found: $slug")
        
        eventRepository.delete(event)
        logger.info("Deleted event: $slug by admin $requesterEmail")
    }
}
