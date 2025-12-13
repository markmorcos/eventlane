package io.eventlane.web.dto

/**
 * Represents either a standalone event or a grouped series.
 * For series, only the next upcoming event is included, with a count of total upcoming events.
 */
data class EventOrSeriesGroupDto(
    val type: String, // "standalone" or "series"
    val seriesSlug: String?, // Only for type="series"
    val seriesTitle: String?, // Only for type="series"
    val upcomingEventsCount: Int, // For series: total upcoming events, for standalone: always 1
    val nextEvent: EventResponseDto, // The next upcoming event (or the standalone event)
)
