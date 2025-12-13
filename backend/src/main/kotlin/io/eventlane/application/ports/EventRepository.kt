package io.eventlane.application.ports

import io.eventlane.domain.model.Event

interface EventRepository {
    fun findBySlug(slug: String): Event
    fun save(event: Event): Event
    fun existsBySlug(slug: String): Boolean
    fun deleteBySlug(slug: String)
    fun findBySeriesId(seriesId: String): List<Event>
    fun findActiveBySeriesId(seriesId: String): List<Event>
}
