@file:Suppress("ktlint:standard:max-line-length")

package io.eventlane.application.migration

import io.eventlane.domain.util.SlugGenerator
import io.eventlane.persistence.repository.SpringDataEventRepository
import io.eventlane.persistence.repository.SpringDataEventSeriesRepository
import org.bson.Document
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Profile
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.stereotype.Component
import java.time.Instant

/**
 * Migration script to:
 * 1. For each event without seriesId, create a one-off EventSeries
 * 2. Remove title, creatorEmail, admins fields from events collection
 *
 * Run with: --spring.profiles.active=event-refactor-migration
 */
@Component
@Profile("event-refactor-migration")
class EventRefactorMigration(
    private val mongoTemplate: MongoTemplate,
    private val eventRepository: SpringDataEventRepository,
    private val seriesRepository: SpringDataEventSeriesRepository,
) : CommandLineRunner {

    private val logger = LoggerFactory.getLogger(EventRefactorMigration::class.java)

    override fun run(vararg args: String?) {
        logger.info("Starting Event refactor migration...")

        val db = mongoTemplate.db
        val eventsCollection = db.getCollection("events")

        val events = eventsCollection.find().toList()
        logger.info("Found ${events.size} events to migrate")

        var migratedCount = 0
        var skippedCount = 0
        var errorCount = 0

        events.forEach { eventDoc ->
            try {
                val slug = eventDoc.getString("slug")
                val seriesId = eventDoc.getString("seriesId")

                if (seriesId != null) {
                    // Event already has seriesId, just remove old fields
                    logger.debug("Event $slug already has seriesId, removing old fields")
                    eventsCollection.updateOne(
                        Document("_id", eventDoc.getObjectId("_id")),
                        Document(
                            "\$unset",
                            Document().apply {
                                put("title", "")
                                put("creatorEmail", "")
                                put("admins", "")
                            },
                        ),
                    )
                    migratedCount++
                    return@forEach
                }

                // Extract fields before they're removed
                val title = eventDoc.getString("title")
                val creatorEmail = eventDoc.getString("creatorEmail")
                val admins = eventDoc.get("admins") as? List<*> ?: emptyList<String>()
                val createdAt = eventDoc.getDate("createdAt")?.toInstant() ?: Instant.now()

                // Create one-off series
                val seriesSlug = SlugGenerator.generateUniqueSlug(title) {
                    seriesRepository.existsBySlug(it)
                }

                val seriesDoc = Document().apply {
                    put("slug", seriesSlug)
                    put("title", title)
                    put("interval", null)
                    put("leadWeeks", 1)
                    put("autoGenerate", false)
                    put("endDate", null)
                    put("creatorEmail", creatorEmail)
                    put("admins", admins)
                    put("createdAt", createdAt)
                    put("updatedAt", Instant.now())
                }

                val seriesCollection = db.getCollection("event_series")
                seriesCollection.insertOne(seriesDoc)
                val insertedSeriesId = seriesDoc.getObjectId("_id").toString()

                logger.info("Created series $seriesSlug for event $slug")

                // Update event: add seriesId, remove old fields
                eventsCollection.updateOne(
                    Document("_id", eventDoc.getObjectId("_id")),
                    Document("\$set", Document("seriesId", insertedSeriesId))
                        .append(
                            "\$unset",
                            Document().apply {
                                put("title", "")
                                put("creatorEmail", "")
                                put("admins", "")
                            },
                        ),
                )

                logger.info("Migrated event $slug")
                migratedCount++
            } catch (e: Exception) {
                logger.error("Error migrating event: ${e.message}", e)
                errorCount++
            }
        }

        logger.info("Migration complete: migrated=$migratedCount, skipped=$skippedCount, errors=$errorCount")
    }
}
