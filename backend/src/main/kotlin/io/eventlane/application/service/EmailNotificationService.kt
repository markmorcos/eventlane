package io.eventlane.application.service

import com.resend.Resend
import com.resend.core.exception.ResendException
import com.resend.services.emails.model.CreateEmailOptions
import com.resend.services.emails.model.CreateEmailResponse
import io.eventlane.domain.model.Attendee
import io.eventlane.domain.model.AttendeeStatus
import io.eventlane.domain.model.Event
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.*

@Service
class EmailNotificationService(
    @Value("\${resend.api-key:}") private val resendApiKey: String,
    @Value("\${resend.from-email:}") private val fromEmail: String,
    @Value("\${app.email.from-name:EventLane}") private val fromName: String,
) {

    private val logger = LoggerFactory.getLogger(EmailNotificationService::class.java)
    private val resend: Resend? = if (resendApiKey.isNotBlank()) Resend(resendApiKey) else null

    init {
        if (resendApiKey.isBlank()) {
            logger.error("Resend API key is missing! Email notifications will not be sent.")
        } else if (fromEmail.isBlank()) {
            logger.error("From email is missing! Email notifications will not be sent.")
        } else {
            logger.info("Resend email service initialized successfully with from: $fromEmail")
        }
    }

    fun sendJoinConfirmation(attendee: Attendee, event: Event, title: String, language: String = "en") {
        val subject = when (language) {
            "de" -> "Anmeldung bestätigt: $title"
            else -> "Registration confirmed: $title"
        }

        val statusText = if (attendee.status == AttendeeStatus.CONFIRMED) {
            when (language) {
                "de" -> "Du bist dabei!"
                else -> "You're confirmed!"
            }
        } else {
            when (language) {
                "de" -> "Du stehst auf der Warteliste"
                else -> "You're on the waitlist"
            }
        }

        val formattedDate = formatEventDate(event, language)

        val htmlContent = """
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>$statusText</h2>
                <p>${if (language == "de") "Hallo" else "Hello"} ${attendee.name},</p>
                <p>${if (language == "de") "Deine Anmeldung für" else "Your registration for"} <strong>$title</strong> ${if (language == "de") "wurde bestätigt" else "has been confirmed"}.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>${if (language == "de") "Veranstaltung" else "Event"}:</strong> $title</p>
                    <p><strong>${if (language == "de") "Datum & Uhrzeit" else "Date & Time"}:</strong> $formattedDate</p>
                    ${event.location?.let { "<p><strong>${if (language == "de") "Ort" else "Location"}:</strong> ${it.formatted}</p>" } ?: ""}
                    <p><strong>Status:</strong> ${attendee.status}</p>
                </div>
                ${if (attendee.status == AttendeeStatus.WAITLISTED) {
            if (language == "de") {
                "<p>Wir benachrichtigen dich, wenn ein Platz für dich frei wird.</p>"
            } else {
                "<p>We'll notify you if a spot opens up for you.</p>"
            }
        } else {
            ""
        }}
                <p>${if (language == "de") "Bis bald" else "See you there"}!<br/>EventLane</p>
            </body>
            </html>
        """.trimIndent()

        sendEmail(attendee.email, subject, htmlContent)
    }

    fun sendPromotionEmail(attendee: Attendee, event: Event, title: String, language: String = "en") {
        val subject = when (language) {
            "de" -> "Platz frei: $title"
            else -> "Spot available: $title"
        }

        val formattedDate = formatEventDate(event, language)

        val htmlContent = """
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>${if (language == "de") "Gute Nachrichten!" else "Good news!"}</h2>
                <p>${if (language == "de") "Hallo" else "Hello"} ${attendee.name},</p>
                <p>${if (language == "de") "Ein Platz ist für dich frei geworden für" else "A spot has opened up for you at"} <strong>$title</strong>!</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>${if (language == "de") "Veranstaltung" else "Event"}:</strong> $title</p>
                    <p><strong>${if (language == "de") "Datum & Uhrzeit" else "Date & Time"}:</strong> $formattedDate</p>
                    ${event.location?.let { "<p><strong>${if (language == "de") "Ort" else "Location"}:</strong> ${it.formatted}</p>" } ?: ""}
                    <p><strong>Status:</strong> CONFIRMED ✓</p>
                </div>
                <p>${if (language == "de") "Bis bald" else "See you there"}!<br/>EventLane</p>
            </body>
            </html>
        """.trimIndent()

        sendEmail(attendee.email, subject, htmlContent)
    }

    fun sendDowngradeEmail(attendee: Attendee, event: Event, title: String, language: String = "en") {
        val subject = when (language) {
            "de" -> "Status-Update: $title"
            else -> "Status update: $title"
        }

        val formattedDate = formatEventDate(event, language)

        val htmlContent = """
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>${if (language == "de") "Status-Update" else "Status Update"}</h2>
                <p>${if (language == "de") "Hallo" else "Hello"} ${attendee.name},</p>
                <p>${if (language == "de") "Aufgrund einer Kapazitätsänderung stehst du jetzt auf der Warteliste für" else "Due to a capacity change, you're now on the waitlist for"} <strong>$title</strong>.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>${if (language == "de") "Veranstaltung" else "Event"}:</strong> $title</p>
                    <p><strong>${if (language == "de") "Datum & Uhrzeit" else "Date & Time"}:</strong> $formattedDate</p>
                    <p><strong>Status:</strong> WAITLISTED</p>
                </div>
                <p>${if (language == "de") "Wir benachrichtigen dich, wenn ein Platz für dich frei wird" else "We'll notify you if a spot opens up for you"}.</p>
                <p>EventLane</p>
            </body>
            </html>
        """.trimIndent()

        sendEmail(attendee.email, subject, htmlContent)
    }

    private fun formatEventDate(event: Event, language: String): String {
        val zoneId = try {
            ZoneId.of(event.timezone)
        } catch (e: Exception) {
            ZoneId.systemDefault()
        }

        val locale = Locale.forLanguageTag(language)

        val formatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.FULL, FormatStyle.SHORT)
            .withLocale(locale)
            .withZone(zoneId)

        return formatter.format(event.eventDate)
    }

    private fun sendEmail(toEmail: String, subject: String, htmlContent: String) {
        if (resend == null || fromEmail.isBlank()) {
            logger.debug("Email sending not configured, skipping email to $toEmail with subject: $subject")
            return
        }

        try {
            val params = CreateEmailOptions.builder()
                .from("$fromName <$fromEmail>")
                .to(toEmail)
                .subject(subject)
                .html(htmlContent)
                .build()

            val response: CreateEmailResponse = resend.emails().send(params)
            logger.info("Email sent successfully to $toEmail (ID: ${response.id})")
        } catch (e: ResendException) {
            logger.error("Error sending email to $toEmail: ${e.message}", e)
        } catch (e: Exception) {
            logger.error("Unexpected error sending email to $toEmail: ${e.message}", e)
        }
    }
}
