package io.eventlane.domain

import io.eventlane.persistence.Attendee
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class RsvpService(
    private val optimisticRetry: OptimisticRetry
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    
    data class RsvpResult(
        val attendee: Attendee,
        val status: String
    )
    
    data class CancelResult(
        val success: Boolean,
        val promoted: Attendee?
    )
    
    fun rsvp(slug: String, userId: String, name: String, email: String): RsvpResult {
        return optimisticRetry.doWithRetry(slug) { event ->
            val normalizedEmail = email.lowercase()
            
            // Check if user already has an active RSVP
            val existingConfirmed = event.confirmedList.find { it.userId == userId }
            val existingWaitlisted = event.waitingList.find { it.userId == userId }
            
            if (existingConfirmed != null) {
                logger.debug("User $userId already has RSVP for event $slug with status CONFIRMED")
                return@doWithRetry RsvpResult(
                    existingConfirmed,
                    "CONFIRMED"
                )
            }
            
            if (existingWaitlisted != null) {
                logger.debug("User $userId already has RSVP for event $slug with status WAITLISTED")
                return@doWithRetry RsvpResult(
                    existingWaitlisted,
                    "WAITLISTED"
                )
            }
            
            // Count confirmed attendees
            val confirmedCount = event.confirmedList.size
            
            val newAttendee = if (confirmedCount < event.capacity) {
                // There's space - confirm immediately
                logger.debug("Confirming attendee $userId for event $slug (capacity: ${event.capacity}, confirmed: $confirmedCount)")
                val attendee = Attendee(
                    userId = userId,
                    name = name,
                    email = normalizedEmail
                )
                event.confirmedList.add(attendee)
                RsvpResult(attendee, "CONFIRMED")
            } else {
                // Event is full - add to waitlist
                logger.debug("Adding attendee $userId to waitlist for event $slug")
                val attendee = Attendee(
                    userId = userId,
                    name = name,
                    email = normalizedEmail
                )
                event.waitingList.add(attendee)
                RsvpResult(attendee, "WAITLISTED")
            }
            
            newAttendee
        }
    }
    
    fun cancel(slug: String, userId: String): CancelResult {
        return optimisticRetry.doWithRetry(slug) { event ->
            val confirmedAttendee = event.confirmedList.find { it.userId == userId }
            val waitlistedAttendee = event.waitingList.find { it.userId == userId }
            
            if (confirmedAttendee == null && waitlistedAttendee == null) {
                logger.debug("No active RSVP found for user $userId in event $slug")
                return@doWithRetry CancelResult(false, null)
            }
            
            var promoted: Attendee? = null
            
            if (confirmedAttendee != null) {
                // Was confirmed - remove completely and promote next from waitlist
                event.confirmedList.remove(confirmedAttendee)
                logger.debug("Removed confirmed attendee $userId from event $slug")
                
                if (event.waitingList.isNotEmpty()) {
                    val nextInLine = event.waitingList.removeAt(0)
                    logger.debug("Promoting attendee ${nextInLine.userId} from waitlist to confirmed")
                    event.confirmedList.add(nextInLine)
                    promoted = nextInLine
                }
            } else if (waitlistedAttendee != null) {
                // Was on waitlist - just remove completely
                event.waitingList.remove(waitlistedAttendee)
                logger.debug("Removed waitlisted attendee $userId from event $slug")
            }
            
            CancelResult(true, promoted)
        }
    }
}
