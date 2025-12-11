package io.eventlane.application.service

import io.eventlane.application.OptimisticRetry
import io.eventlane.application.ports.EventDeltaPublisher
import io.eventlane.domain.behavior.EventBehavior
import io.eventlane.domain.model.EventDelta
import io.eventlane.domain.model.ForbiddenException
import org.springframework.stereotype.Service

@Service
class AttendanceService(
    private val retry: OptimisticRetry,
    private val publisher: EventDeltaPublisher,
) {

    fun attend(slug: String, name: String, email: String): EventDelta {
        val (saved, delta) = retry.run(slug) { event ->
            EventBehavior.addAttendee(event, name, email)
        }

        publisher.publish(saved, listOf(delta))

        return delta
    }

    fun cancel(slug: String, email: String, requesterEmail: String): List<EventDelta> {
        val (saved, deltas) = retry.run(slug) { event ->
            val removingSelf = email == requesterEmail
            val isAdmin = event.isAdmin(requesterEmail)

            if (!removingSelf && !isAdmin) {
                throw ForbiddenException("Only admins can remove other attendees")
            }

            EventBehavior.removeAttendee(event, email)
        }

        publisher.publish(saved, deltas)

        return deltas
    }
}
