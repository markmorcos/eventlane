package io.eventlane.web.dto

/**
 * Represents either a standalone event or a grouped series.
 * For series, only the next upcoming event is included, with a count of total upcoming events.
 */
data class EventOrSeriesGroupDto(
    val type: String,
    val seriesSlug: String?,
    val seriesTitle: String?,
    val upcomingEventsCount: Int,
    val nextEvent: EventResponseDto,
)
