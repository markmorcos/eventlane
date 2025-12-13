package io.eventlane.persistence.mapper

import io.eventlane.domain.model.EventSeries
import io.eventlane.persistence.document.EventSeriesDocument
import java.time.Duration

object EventSeriesPersistenceMapper {
    fun toDomain(doc: EventSeriesDocument): EventSeries = EventSeries(
        id = doc.id!!,
        slug = doc.slug,
        title = doc.title,
        interval = doc.interval?.let { Duration.parse(it) },
        leadWeeks = doc.leadWeeks,
        autoGenerate = doc.autoGenerate,
        anchorDate = doc.anchorDate,
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
        interval = domain.interval?.toString(),
        leadWeeks = domain.leadWeeks,
        autoGenerate = domain.autoGenerate,
        anchorDate = domain.anchorDate,
        endDate = domain.endDate,
        creatorEmail = domain.creatorEmail,
        admins = domain.admins,
        createdAt = domain.createdAt,
        updatedAt = domain.updatedAt,
        version = domain.version,
    )
}
