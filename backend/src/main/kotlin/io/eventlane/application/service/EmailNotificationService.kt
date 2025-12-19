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
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.*

@Service
class EmailNotificationService(
    @Value("\${resend.api-key:}") private val resendApiKey: String,
    @Value("\${resend.from-email:}") private val fromEmail: String,
    @Value("\${app.email.from-name:}") private val fromName: String,
    @Value("\${app.email.enabled:}") private val emailEnabled: Boolean,
) {

    private val logger = LoggerFactory.getLogger(EmailNotificationService::class.java)
    private val resend: Resend? = if (resendApiKey.isNotBlank()) Resend(resendApiKey) else null

    init {
        if (!emailEnabled) {
            logger.info("Email notifications are disabled.")
        } else if (resendApiKey.isBlank()) {
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
            <!DOCTYPE html>
            <html lang="${if (language == "de") "de" else "en"}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>$subject</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header with Logo -->
                                <tr>
                                    <td style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, #2D5BFF 0%, #1e40bf 100%); border-radius: 12px 12px 0 0;">
                                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">EventLane</h1>
                                    </td>
                                </tr>

                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #1a1d23; line-height: 1.3;">$statusText</h1>

                                        <p style="margin: 0 0 20px 0; font-size: 16px; color: #4a5568;">${if (language == "de") "Hallo" else "Hello"} ${attendee.name},</p>

                                        <p style="margin: 0 0 28px 0; font-size: 16px; color: #4a5568;">${if (language == "de") "Deine Anmeldung für" else "Your registration for"} <strong style="color: #1a1d23;">$title</strong> ${if (language == "de") "wurde bestätigt" else "has been confirmed"}.</p>

                                        <!-- Event Details Card -->
                                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; margin-bottom: 28px;">
                                            <tr>
                                                <td style="padding: 24px;">
                                                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                        <tr>
                                                            <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 600;">${if (language == "de") "VERANSTALTUNG" else "EVENT"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 0 0 16px 0; font-size: 18px; color: #1a1d23; font-weight: 600;">$title</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                                                                <table role="presentation" style="width: 100%;">
                                                                    <tr>
                                                                        <td style="font-size: 14px; color: #64748b; padding: 4px 0;">${if (language == "de") "Datum & Uhrzeit" else "Date & Time"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="font-size: 15px; color: #1a1d23; padding: 4px 0;">$formattedDate</td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        ${event.location?.let {
            """
                                                        <tr>
                                                            <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                                                                <table role="presentation" style="width: 100%;">
                                                                    <tr>
                                                                        <td style="font-size: 14px; color: #64748b; padding: 4px 0;">${if (language == "de") "Ort" else "Location"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="font-size: 15px; color: #1a1d23; padding: 4px 0;">${it.formatted}</td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        """
        } ?: ""}
                                                        <tr>
                                                            <td style="padding: 12px 0 0 0; border-top: 1px solid #e2e8f0;">
                                                                <span style="display: inline-block; padding: 6px 12px; background-color: ${if (attendee.status == AttendeeStatus.CONFIRMED) "#dcfce7" else "#fef3c7"}; color: ${if (attendee.status == AttendeeStatus.CONFIRMED) "#166534" else "#92400e"}; border-radius: 6px; font-size: 13px; font-weight: 600;">
                                                                    ${if (attendee.status == AttendeeStatus.CONFIRMED) "✓ ${if (language == "de") "BESTÄTIGT" else "CONFIRMED"}" else "⏱ ${if (language == "de") "WARTELISTE" else "WAITLISTED"}"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        ${if (attendee.status == AttendeeStatus.WAITLISTED) {
            """<p style="margin: 0 0 24px 0; font-size: 16px; color: #4a5568; background-color: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                                                ${if (language == "de") "Wir benachrichtigen dich, wenn ein Platz für dich frei wird." else "We'll notify you if a spot opens up for you."}
                                            </p>"""
        } else {
            ""
        }
        }

                                        <p style="margin: 24px 0 0 0; font-size: 16px; color: #4a5568;">${if (language == "de") "Bis bald" else "See you there"}!<br/><strong style="color: #1a1d23;">EventLane Team</strong></p>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 24px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; font-size: 13px; color: #94a3b8;">© ${java.time.Year.now().value} EventLane. ${if (language == "de") "Alle Rechte vorbehalten." else "All rights reserved."}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
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
            <!DOCTYPE html>
            <html lang="${if (language == "de") "de" else "en"}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>$subject</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header with Logo -->
                                <tr>
                                    <td style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
                                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">EventLane</h1>
                                    </td>
                                </tr>

                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <div style="text-align: center; margin-bottom: 24px;">
                                            <span style="font-size: 48px;">🎉</span>
                                        </div>

                                        <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #1a1d23; line-height: 1.3; text-align: center;">${if (language == "de") "Gute Nachrichten!" else "Good news!"}</h1>

                                        <p style="margin: 0 0 20px 0; font-size: 16px; color: #4a5568;">${if (language == "de") "Hallo" else "Hello"} ${attendee.name},</p>

                                        <p style="margin: 0 0 28px 0; font-size: 16px; color: #4a5568;">${if (language == "de") "Ein Platz ist für dich frei geworden für" else "A spot has opened up for you at"} <strong style="color: #1a1d23;">$title</strong>!</p>

                                        <!-- Event Details Card -->
                                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; margin-bottom: 28px;">
                                            <tr>
                                                <td style="padding: 24px;">
                                                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                        <tr>
                                                            <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 600;">${if (language == "de") "VERANSTALTUNG" else "EVENT"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 0 0 16px 0; font-size: 18px; color: #1a1d23; font-weight: 600;">$title</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                                                                <table role="presentation" style="width: 100%;">
                                                                    <tr>
                                                                        <td style="font-size: 14px; color: #64748b; padding: 4px 0;">${if (language == "de") "Datum & Uhrzeit" else "Date & Time"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="font-size: 15px; color: #1a1d23; padding: 4px 0;">$formattedDate</td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        ${event.location?.let {
            """
                                                        <tr>
                                                            <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                                                                <table role="presentation" style="width: 100%;">
                                                                    <tr>
                                                                        <td style="font-size: 14px; color: #64748b; padding: 4px 0;">${if (language == "de") "Ort" else "Location"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="font-size: 15px; color: #1a1d23; padding: 4px 0;">${it.formatted}</td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        """
        } ?: ""}
                                                        <tr>
                                                            <td style="padding: 12px 0 0 0; border-top: 1px solid #e2e8f0;">
                                                                <span style="display: inline-block; padding: 6px 12px; background-color: #dcfce7; color: #166534; border-radius: 6px; font-size: 13px; font-weight: 600;">
                                                                    ✓ ${if (language == "de") "BESTÄTIGT" else "CONFIRMED"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin: 24px 0 0 0; font-size: 16px; color: #4a5568;">${if (language == "de") "Bis bald" else "See you there"}!<br/><strong style="color: #1a1d23;">EventLane Team</strong></p>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 24px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; font-size: 13px; color: #94a3b8;">© ${java.time.Year.now().value} EventLane. ${if (language == "de") "Alle Rechte vorbehalten." else "All rights reserved."}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
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
            <!DOCTYPE html>
            <html lang="${if (language == "de") "de" else "en"}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>$subject</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header with Logo -->
                                <tr>
                                    <td style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px 12px 0 0;">
                                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">EventLane</h1>
                                    </td>
                                </tr>

                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #1a1d23; line-height: 1.3;">${if (language == "de") "Status-Update" else "Status Update"}</h1>

                                        <p style="margin: 0 0 20px 0; font-size: 16px; color: #4a5568;">${if (language == "de") "Hallo" else "Hello"} ${attendee.name},</p>

                                        <p style="margin: 0 0 28px 0; font-size: 16px; color: #4a5568;">${if (language == "de") "Aufgrund einer Kapazitätsänderung stehst du jetzt auf der Warteliste für" else "Due to a capacity change, you're now on the waitlist for"} <strong style="color: #1a1d23;">$title</strong>.</p>

                                        <!-- Event Details Card -->
                                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; margin-bottom: 28px;">
                                            <tr>
                                                <td style="padding: 24px;">
                                                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                        <tr>
                                                            <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 600;">${if (language == "de") "VERANSTALTUNG" else "EVENT"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 0 0 16px 0; font-size: 18px; color: #1a1d23; font-weight: 600;">$title</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                                                                <table role="presentation" style="width: 100%;">
                                                                    <tr>
                                                                        <td style="font-size: 14px; color: #64748b; padding: 4px 0;">${if (language == "de") "Datum & Uhrzeit" else "Date & Time"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="font-size: 15px; color: #1a1d23; padding: 4px 0;">$formattedDate</td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 0 0 0; border-top: 1px solid #e2e8f0;">
                                                                <span style="display: inline-block; padding: 6px 12px; background-color: #fef3c7; color: #92400e; border-radius: 6px; font-size: 13px; font-weight: 600;">
                                                                    ⏱ ${if (language == "de") "WARTELISTE" else "WAITLISTED"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin: 0 0 24px 0; font-size: 16px; color: #4a5568; background-color: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                                            ${if (language == "de") "Wir benachrichtigen dich, wenn ein Platz für dich frei wird." else "We'll notify you if a spot opens up for you."}
                                        </p>

                                        <p style="margin: 24px 0 0 0; font-size: 16px; color: #4a5568;"><strong style="color: #1a1d23;">EventLane Team</strong></p>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 24px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; font-size: 13px; color: #94a3b8;">© ${java.time.Year.now().value} EventLane. ${if (language == "de") "Alle Rechte vorbehalten." else "All rights reserved."}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        """.trimIndent()

        sendEmail(attendee.email, subject, htmlContent)
    }

    fun sendEventCancellationEmail(attendee: Attendee, event: Event, title: String, language: String = "en") {
        val subject = when (language) {
            "de" -> "Veranstaltung abgesagt: $title"
            else -> "Event cancelled: $title"
        }

        val formattedDate = formatEventDate(event, language)

        val htmlContent = """
            <!DOCTYPE html>
            <html lang="${if (language == "de") "de" else "en"}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>$subject</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header with Logo -->
                                <tr>
                                    <td style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 12px 12px 0 0;">
                                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">EventLane</h1>
                                    </td>
                                </tr>

                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #1a1d23; line-height: 1.3;">${if (language == "de") "Veranstaltung abgesagt" else "Event Cancelled"}</h1>

                                        <p style="margin: 0 0 20px 0; font-size: 16px; color: #4a5568;">${if (language == "de") "Hallo" else "Hello"} ${attendee.name},</p>

                                        <p style="margin: 0 0 28px 0; font-size: 16px; color: #4a5568;">${if (language == "de") "Leider müssen wir dir mitteilen, dass" else "Unfortunately, we have to inform you that"} <strong style="color: #1a1d23;">$title</strong> ${if (language == "de") "abgesagt wurde" else "has been cancelled"}.</p>

                                        <!-- Event Details Card -->
                                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; margin-bottom: 28px;">
                                            <tr>
                                                <td style="padding: 24px;">
                                                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                        <tr>
                                                            <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 600;">${if (language == "de") "VERANSTALTUNG" else "EVENT"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 0 0 16px 0; font-size: 18px; color: #1a1d23; font-weight: 600;">$title</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                                                                <table role="presentation" style="width: 100%;">
                                                                    <tr>
                                                                        <td style="font-size: 14px; color: #64748b; padding: 4px 0;">${if (language == "de") "Geplant für" else "Was scheduled for"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="font-size: 15px; color: #1a1d23; padding: 4px 0;">$formattedDate</td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        ${event.location?.let {
            """
                                                        <tr>
                                                            <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                                                                <table role="presentation" style="width: 100%;">
                                                                    <tr>
                                                                        <td style="font-size: 14px; color: #64748b; padding: 4px 0;">${if (language == "de") "Ort" else "Location"}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="font-size: 15px; color: #1a1d23; padding: 4px 0;">${it.formatted}</td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        """
        } ?: ""}
                                                        <tr>
                                                            <td style="padding: 12px 0 0 0; border-top: 1px solid #e2e8f0;">
                                                                <span style="display: inline-block; padding: 6px 12px; background-color: #fee2e2; color: #991b1b; border-radius: 6px; font-size: 13px; font-weight: 600;">
                                                                    ✕ ${if (language == "de") "ABGESAGT" else "CANCELLED"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin: 0 0 24px 0; font-size: 16px; color: #4a5568; background-color: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626;">
                                            ${if (language == "de") "Wir entschuldigen uns für etwaige Unannehmlichkeiten. Schau dir gerne unsere anderen Veranstaltungen an." else "We apologize for any inconvenience. Feel free to check out our other events."}
                                        </p>

                                        <p style="margin: 0; font-size: 16px; color: #4a5568;">
                                            ${if (language == "de") "Bei Fragen stehen wir dir gerne zur Verfügung." else "If you have any questions, please feel free to reach out."}
                                        </p>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; text-align: center;">
                                        <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                                            © ${java.time.Year.now().value} EventLane. ${if (language == "de") "Alle Rechte vorbehalten." else "All rights reserved."}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
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

    @Async("emailTaskExecutor")
    private fun sendEmail(toEmail: String, subject: String, htmlContent: String) {
        if (!emailEnabled || resend == null || fromEmail.isBlank()) {
            logger.debug(
                "Email sending is either disabled or not configured, skipping email to $toEmail with subject: $subject",
            )
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
