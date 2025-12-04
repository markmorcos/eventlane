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
    
    fun rsvp(slug: String, userId: String, name: String, email: String): RsvpResult {
        return optimisticRetry.doWithRetry(slug) { event ->
            val normalizedEmail = email.lowercase()
            
            val existingConfirmed = event.confirmedList.find { it.email == normalizedEmail }
            val existingWaitlisted = event.waitingList.find { it.email == normalizedEmail }
            
            if (existingConfirmed != null) {
                logger.debug("User $email already has RSVP for event $slug with status CONFIRMED")
                return@doWithRetry RsvpResult(
                    existingConfirmed,
                    "CONFIRMED"
                )
            }
            
            if (existingWaitlisted != null) {
                logger.debug("User $email already has RSVP for event $slug with status WAITLISTED")
                return@doWithRetry RsvpResult(
                    existingWaitlisted,
                    "WAITLISTED"
                )
            }
            
            val confirmedCount = event.confirmedList.size
            
            val newAttendee = if (confirmedCount < event.capacity) {
                logger.debug("Confirming attendee $email for event $slug (capacity: ${event.capacity}, confirmed: $confirmedCount)")
                val attendee = Attendee(
                    userId = userId,
                    name = name,
                    email = normalizedEmail
                )
                event.confirmedList.add(attendee)
                RsvpResult(attendee, "CONFIRMED")
            } else {
                logger.debug("Adding attendee $email to waitlist for event $slug")
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
    
    fun cancel(slug: String, email: String): Boolean {
        return optimisticRetry.doWithRetry(slug) { event ->
            val confirmedAttendee = event.confirmedList.find { it.email == email }
            val waitlistedAttendee = event.waitingList.find { it.email == email }
            
            if (confirmedAttendee == null && waitlistedAttendee == null) {
                logger.debug("No active RSVP found for user $email in event $slug")
                return@doWithRetry false
            }
            
            if (confirmedAttendee != null) {
                event.confirmedList.remove(confirmedAttendee)
                logger.debug("Removed confirmed attendee $email from event $slug")
                
                if (event.waitingList.isNotEmpty()) {
                    val nextInLine = event.waitingList.removeAt(0)
                    logger.debug("Promoting attendee ${nextInLine.email} from waitlist to confirmed")
                    event.confirmedList.add(nextInLine)
                }
            } else if (waitlistedAttendee != null) {
                event.waitingList.remove(waitlistedAttendee)
                logger.debug("Removed waitlisted attendee $email from event $slug")
            }
            
            true
        }
    }
}
