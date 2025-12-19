package io.eventlane.application.service

import io.eventlane.application.OptimisticRetry
import io.eventlane.application.ports.EventDeltaPublisher
import io.eventlane.application.ports.EventSeriesRepository
import io.eventlane.domain.behavior.EventBehavior
import io.eventlane.domain.model.AttendeeAdded
import io.eventlane.domain.model.AttendeeStatusChanged
import io.eventlane.domain.model.EventDelta
import io.eventlane.domain.model.ForbiddenException
import org.springframework.stereotype.Service

@Service
class AttendanceService(
    private val retry: OptimisticRetry,
    private val seriesRepository: EventSeriesRepository,
    private val publisher: EventDeltaPublisher,
    private val emailService: EmailNotificationService,
) {

    fun attend(slug: String, name: String, email: String, language: String = "en"): EventDelta {
        val (saved, delta) = retry.run(slug) { event ->
            EventBehavior.addAttendee(event, name, email, language)
        }

        publisher.publish(saved, listOf(delta))

        if (delta is AttendeeAdded) {
            val series = seriesRepository.findById(saved.seriesId)
            emailService.sendJoinConfirmation(delta.attendee, saved, series.title, language)
        }

        return delta
    }

    fun cancel(slug: String, email: String, requesterEmail: String): List<EventDelta> {
        val (saved, deltas) = retry.run(slug) { event ->
            val removingSelf = email == requesterEmail
            val series = seriesRepository.findById(event.seriesId)
            val isAdmin = series.isAdmin(requesterEmail)

            if (!removingSelf && !isAdmin) {
                throw ForbiddenException("Only admins can remove other attendees")
            }

            EventBehavior.removeAttendee(event, email)
        }

        publisher.publish(saved, deltas)

        val series = seriesRepository.findById(saved.seriesId)
        deltas.filterIsInstance<AttendeeStatusChanged>().forEach { delta ->
            val promotedAttendee = saved.findAttendeeByEmail(delta.attendeeEmail)
            if (promotedAttendee != null) {
                emailService.sendPromotionEmail(promotedAttendee, saved, series.title, promotedAttendee.language)
            }
        }

        return deltas
    }
}
