package io.eventlane.domain

import io.eventlane.persistence.Attendee
import io.eventlane.persistence.EventDocument
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class CapacityService(
    private val optimisticRetry: OptimisticRetry,
    private val eventPermissionService: EventPermissionService
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    
    data class CapacityChangeResult(
        val event: EventDocument,
        val promoted: List<Attendee>,
        val demoted: List<Attendee>
    )
    
    fun updateCapacity(slug: String, newCapacity: Int, adminEmail: String): CapacityChangeResult {
        eventPermissionService.requireAdmin(slug, adminEmail)
        
        if (newCapacity < 0) {
            throw BadRequestException("Capacity cannot be negative")
        }
        
        return optimisticRetry.doWithRetry(slug) { event ->
            val oldCapacity = event.capacity
            event.capacity = newCapacity
            
            logger.debug("Updating capacity for event $slug from $oldCapacity to $newCapacity")
            
            val promoted = mutableListOf<Attendee>()
            val demoted = mutableListOf<Attendee>()
            
            when {
                newCapacity > event.confirmedList.size -> {
                    // We have more space - promote from waitlist
                    val slotsToFill = newCapacity - event.confirmedList.size
                    val numToPromote = minOf(slotsToFill, event.waitingList.size)
                    
                    repeat(numToPromote) {
                        val attendee = event.waitingList.removeAt(0)
                        logger.debug("Promoting attendee ${attendee.userId} from waitlist to confirmed")
                        event.confirmedList.add(attendee)
                        promoted.add(attendee)
                    }
                }
                
                newCapacity < event.confirmedList.size -> {
                    // We have less space - demote most recent confirmed
                    val demotionsNeeded = event.confirmedList.size - newCapacity
                    
                    // Take last N confirmed attendees to demote
                    val toDemote = event.confirmedList.takeLast(demotionsNeeded)
                    
                    toDemote.forEach { attendee ->
                        logger.debug("Demoting attendee ${attendee.userId} from confirmed to waitlist")
                        event.confirmedList.remove(attendee)
                        event.waitingList.add(0, attendee)  // Add to beginning
                        demoted.add(attendee)
                    }
                }
                
                else -> {
                    // Capacity matches confirmed count - no changes needed
                    logger.debug("Capacity change for event $slug resulted in no promotions or demotions")
                }
            }
            
            CapacityChangeResult(event, promoted, demoted)
        }
    }
}
