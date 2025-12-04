package io.eventlane.application.ports

import io.eventlane.domain.model.Event

interface EventRepository {
    fun findBySlug(slug: String): Event
    fun save(event: Event): Event
    fun existsBySlug(slug: String): Boolean
    fun findByAdmin(email: String): List<Event>
    fun deleteBySlug(slug: String)
}
