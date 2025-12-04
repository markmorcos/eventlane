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

    fun attend(slug: String, userId: String, name: String, email: String): EventDelta {
        val (_, delta) = retry.run(slug) { event ->
            EventBehavior.addAttendee(event, userId, name, email)
        }

        publisher.publish(slug, listOf(delta))

        return delta
    }

    fun cancel(slug: String, email: String, requesterEmail: String): List<EventDelta> {
        val (_, deltas) = retry.run(slug) { event ->
            val removingSelf = email == requesterEmail
            val isAdmin = event.isAdmin(requesterEmail)

            if (!removingSelf && !isAdmin) {
                throw ForbiddenException("Only admins can remove other attendees")
            }

            EventBehavior.removeAttendee(event, email)
        }

        if (deltas.isNotEmpty()) {
            publisher.publish(slug, deltas)
        }

        return deltas
    }
}
