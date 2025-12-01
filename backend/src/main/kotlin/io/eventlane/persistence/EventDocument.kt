package io.eventlane.persistence

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("events")
data class EventDocument(
    @Id
    val id: String? = null,
    
    @Indexed(unique = true)
    val slug: String,
    
    val title: String,
    
    var capacity: Int,
    
    val admins: MutableList<String> = mutableListOf(),
    
    val confirmedList: MutableList<Attendee> = mutableListOf(),
    
    val waitingList: MutableList<Attendee> = mutableListOf(),
    
    val createdAt: Instant = Instant.now(),
    
    var updatedAt: Instant = Instant.now(),
    
    @Version
    val version: Long? = null
)
