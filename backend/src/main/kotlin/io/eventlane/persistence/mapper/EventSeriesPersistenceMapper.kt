package io.eventlane.persistence.mapper

import io.eventlane.domain.model.EventSeries
import io.eventlane.persistence.document.EventSeriesDocument

object EventSeriesPersistenceMapper {
    fun toDomain(doc: EventSeriesDocument): EventSeries = EventSeries(
        id = doc.id!!,
        slug = doc.slug,
        title = doc.title,
        interval = doc.interval,
        leadWeeks = doc.leadWeeks,
        autoGenerate = doc.autoGenerate,
        anchorDate = doc.anchorDate,
        timezone = doc.timezone,
        endDate = doc.endDate,
        creatorEmail = doc.creatorEmail,
        admins = doc.admins,
        createdAt = doc.createdAt,
        updatedAt = doc.updatedAt,
        version = doc.version,
    )

    fun toDocument(domain: EventSeries): EventSeriesDocument = EventSeriesDocument(
        id = domain.id,
        slug = domain.slug,
        title = domain.title,
        interval = domain.interval,
        leadWeeks = domain.leadWeeks,
        autoGenerate = domain.autoGenerate,
        anchorDate = domain.anchorDate,
        timezone = domain.timezone,
        endDate = domain.endDate,
        creatorEmail = domain.creatorEmail,
        admins = domain.admins,
        createdAt = domain.createdAt,
        updatedAt = domain.updatedAt,
        version = domain.version,
    )
}
