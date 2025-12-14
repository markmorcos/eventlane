package io.eventlane.application.scheduler

import io.eventlane.application.ports.EventRepository
import io.eventlane.application.ports.EventSeriesRepository
import io.eventlane.application.service.EventCommandService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Duration
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
                val count = generateEventsForSeries(series)
                generatedCount += count
                if (count == 0) {
                    skippedCount++
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

    fun generateEventsForSeries(series: io.eventlane.domain.model.EventSeries): Int {
        logger.debug("Processing series: ${series.slug} with interval=${series.interval}")

        if (series.interval == null) {
            logger.debug("Series ${series.slug} has no interval (one-off), skipping")
            return 0
        }

        val now = Instant.now()
        val coverageEnd = now.plus(series.leadWeeks.toLong() * 7, ChronoUnit.DAYS)

        // Check if series has ended
        if (series.endDate != null && series.endDate < now) {
            logger.debug("Series ${series.slug} has ended, skipping")
            return 0
        }

        // Find active events in this series
        val activeEvents = eventRepository.findActiveBySeriesId(series.id!!)

        // Find the latest active event by eventDate
        val latestEvent = activeEvents.maxByOrNull { it.eventDate }

        val startFrom = latestEvent?.eventDate ?: now

        // Get any existing active event to copy capacity and timezone from
        val templateEvent = activeEvents.firstOrNull()

        if (templateEvent == null) {
            logger.warn("Series ${series.slug} has no events to use as template, skipping")
            return 0
        }

        // Generate events until coverage is satisfied
        var nextEventDate = startFrom.plus(Duration.parse(series.interval))
        var eventsCreatedForSeries = 0

        while (nextEventDate <= coverageEnd) {
            // Stop at series endDate if specified
            if (series.endDate != null && nextEventDate > series.endDate) {
                break
            }

            // Check if an active event already exists at this date (ignore deleted ones)
            val eventExistsAtDate = activeEvents.any { event ->
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
            }

            nextEventDate = nextEventDate.plus(Duration.parse(series.interval))
        }

        if (eventsCreatedForSeries > 0) {
            logger.info("Generated $eventsCreatedForSeries events for series ${series.slug}")
        }

        return eventsCreatedForSeries
    }
}
