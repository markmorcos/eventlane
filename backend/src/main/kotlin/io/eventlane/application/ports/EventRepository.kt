package io.eventlane.application.ports

import io.eventlane.domain.model.Event
import java.time.Instant

interface EventRepository {
    fun findBySlug(slug: String): Event
    fun save(event: Event): Event
    fun existsBySlug(slug: String): Boolean
    fun deleteBySlug(slug: String)
    fun findBySeriesId(seriesId: String): List<Event>
    fun findActiveBySeriesId(seriesId: String): List<Event>
    fun findUpcomingActiveBySeriesId(seriesId: String, from: Instant): List<Event>
    fun findUpcomingEventsWhereUserAttends(seriesId: String, from: Instant, email: String): List<Event>
}
