
@file:Suppress("ktlint:standard:max-line-length")

package io.eventlane.application.migration

import io.eventlane.persistence.repository.SpringDataEventRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Profile
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.data.mongodb.core.query.Query
import org.springframework.stereotype.Component
import java.time.Instant

/**
 * Migration script to combine confirmedList and waitingList into a single attendees list.
 * Adds status field to each attendee (CONFIRMED or WAITLISTED).
 *
 * Run with: --spring.profiles.active=attendee-migration
 */
@Component
@Profile("attendee-list-migration")
class AttendeeListMigration(
    private val eventRepository: SpringDataEventRepository,
    private val mongoTemplate: MongoTemplate,
) : CommandLineRunner {

    private val logger = LoggerFactory.getLogger(AttendeeListMigration::class.java)

    override fun run(vararg args: String?) {
        logger.info("Starting attendee list migration (confirmedList + waitingList -> attendees)...")

        // Use MongoTemplate to get raw documents
        val query = Query()
        val rawDocuments = mongoTemplate.find(query, Map::class.java, "events")

        logger.info("Found ${rawDocuments.size} events to migrate")

        var migratedCount = 0
        var skippedCount = 0
        var errorCount = 0

        rawDocuments.forEach { rawDoc ->
            try {
                val id = rawDoc["_id"] as? String
                val slug = rawDoc["slug"] as? String

                if (id == null || slug == null) {
                    logger.warn("Event missing id or slug, skipping")
                    errorCount++
                    return@forEach
                }

                // Check if already migrated (has attendees field and no confirmedList/waitingList)
                if (rawDoc.containsKey("attendees") &&
                    !rawDoc.containsKey("confirmedList") &&
                    !rawDoc.containsKey("waitingList")
                ) {
                    logger.debug("Event $slug already migrated, skipping")
                    skippedCount++
                    return@forEach
                }

                val confirmedList = rawDoc["confirmedList"] as? List<Map<String, Any>> ?: emptyList()
                val waitingList = rawDoc["waitingList"] as? List<Map<String, Any>> ?: emptyList()

                // Convert to new format with status field
                val attendees = mutableListOf<Map<String, Any>>()

                confirmedList.forEach { attendee ->
                    val name = attendee["name"] as? String ?: ""
                    val email = attendee["email"] as? String ?: ""
                    val createdAt = attendee["createdAt"] ?: attendee["joinedAt"] ?: Instant.now()

                    attendees.add(
                        mapOf(
                            "name" to name,
                            "email" to email,
                            "status" to "CONFIRMED",
                            "joinedAt" to createdAt,
                        ),
                    )
                }

                waitingList.forEach { attendee ->
                    val name = attendee["name"] as? String ?: ""
                    val email = attendee["email"] as? String ?: ""
                    val createdAt = attendee["createdAt"] ?: attendee["joinedAt"] ?: Instant.now()

                    attendees.add(
                        mapOf(
                            "name" to name,
                            "email" to email,
                            "status" to "WAITLISTED",
                            "joinedAt" to createdAt,
                        ),
                    )
                }

                // Update the document using MongoTemplate
                val update = org.springframework.data.mongodb.core.query.Update()
                update.set("attendees", attendees)
                update.unset("confirmedList")
                update.unset("waitingList")
                update.set("updatedAt", Instant.now())

                val updateQuery = org.springframework.data.mongodb.core.query.Query.query(
                    org.springframework.data.mongodb.core.query.Criteria.where("_id").`is`(id),
                )

                mongoTemplate.updateFirst(updateQuery, update, "events")

                logger.info(
                    "Migrated event $slug: ${confirmedList.size} confirmed + ${waitingList.size} waitlisted = ${attendees.size} total attendees",
                )
                migratedCount++
            } catch (e: Exception) {
                logger.error("Error migrating event: ${e.message}", e)
                errorCount++
            }
        }

        logger.info("Attendee migration complete: migrated=$migratedCount, skipped=$skippedCount, errors=$errorCount")
    }
}
