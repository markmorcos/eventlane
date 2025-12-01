package io.eventlane.persistence

import java.time.Instant
import java.util.*

data class Attendee(
    val id: String = UUID.randomUUID().toString(),
    
    val userId: String,
    
    val name: String,
    
    val email: String,
    
    val createdAt: Instant = Instant.now()
)
