package io.eventlane.application.ports

import io.eventlane.domain.model.EventSeries

interface EventSeriesRepository {
    fun findBySlug(slug: String): EventSeries
    fun findById(id: String): EventSeries
    fun save(series: EventSeries): EventSeries
    fun existsBySlug(slug: String): Boolean
    fun findByCreatorOrAdmin(email: String): List<EventSeries>
    fun findByAutoGenerateTrue(): List<EventSeries>
    fun deleteBySlug(slug: String)
}
