package io.eventlane.application.scheduler

import io.eventlane.application.ports.EventRepository
import io.eventlane.application.ports.EventSeriesRepository
import io.eventlane.application.service.EventCommandService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.temporal.ChronoUnit

/**
 * Scheduled job to generate recurring events for event series.
 * Runs hourly to ensure events exist up to (now + leadWeeks).
 */
@Component
class RecurrenceGenerationJob(
    private val seriesRepository: EventSeriesRepository,
    private val eventRepository: EventRepository,
    private val eventCommandService: EventCommandService,
) {

    private val logger = LoggerFactory.getLogger(RecurrenceGenerationJob::class.java)

    @Scheduled(fixedRate = 60000) // Run every minute (60000 ms)
    fun generateRecurringEvents() {
        logger.info("Starting recurrence generation job")

        val activeSeries = seriesRepository.findByAutoGenerateTrue()
        logger.info("Found ${activeSeries.size} active series with autoGenerate=true")

        var generatedCount = 0
        var skippedCount = 0
        var errorCount = 0

        activeSeries.forEach { series ->
            try {
                if (series.interval == null) {
                    logger.debug("Series ${series.slug} has no interval (one-off), skipping")
                    skippedCount++
                    return@forEach
                }

                val now = Instant.now()
                val coverageEnd = now.plus(series.leadWeeks.toLong() * 7, ChronoUnit.DAYS)

                // Check if series has ended
                if (series.endDate != null && series.endDate < now) {
                    logger.debug("Series ${series.slug} has ended, skipping")
                    skippedCount++
                    return@forEach
                }

                // Find all events in this series (including deleted ones)
                val existingEvents = eventRepository.findBySeriesId(series.id!!)

                // Find the latest event by eventDate
                val latestEvent = existingEvents.maxByOrNull { it.eventDate }

                val startFrom = latestEvent?.eventDate ?: now

                // Get any existing event to copy capacity and timezone from
                val templateEvent = existingEvents.firstOrNull()

                if (templateEvent == null) {
                    logger.warn("Series ${series.slug} has no events to use as template, skipping")
                    skippedCount++
                    return@forEach
                }

                // Generate events until coverage is satisfied
                var nextEventDate = startFrom.plus(series.interval)
                var eventsCreatedForSeries = 0

                while (nextEventDate <= coverageEnd) {
                    // Stop at series endDate if specified
                    if (series.endDate != null && nextEventDate > series.endDate) {
                        break
                    }

                    // Check if an event already exists at this date
                    val eventExistsAtDate = existingEvents.any { event ->
                        event.eventDate == nextEventDate
                    }

                    if (!eventExistsAtDate) {
                        // Create new event
                        eventCommandService.createEvent(
                            capacity = templateEvent.capacity,
                            eventDate = nextEventDate,
                            timezone = templateEvent.timezone,
                            seriesId = series.id,
                        )
                        eventsCreatedForSeries++
                        generatedCount++
                    }

                    nextEventDate = nextEventDate.plus(series.interval)
                }

                if (eventsCreatedForSeries > 0) {
                    logger.info("Generated $eventsCreatedForSeries events for series ${series.slug}")
                }
            } catch (e: Exception) {
                logger.error("Error generating events for series ${series.slug}: ${e.message}", e)
                errorCount++
            }
        }

        logger.info(
            "Recurrence generation complete: generated=$generatedCount, skipped=$skippedCount, errors=$errorCount",
        )
    }
}
