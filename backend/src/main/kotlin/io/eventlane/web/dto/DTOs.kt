package io.eventlane.web.dto

data class AttendeeDTO(
    val id: String,
    val userId: String,
    val name: String,
    val email: String,
    val status: String,
    val createdAt: Long
)

data class EventSummaryDTO(
    val id: String,
    val slug: String,
    val title: String,
    val capacity: Int,
    val confirmedCount: Int,
    val waitlistCount: Int,
    val isAdmin: Boolean,
    val createdAt: Long
)

data class EventDetailDTO(
    val id: String,
    val slug: String,
    val title: String,
    val capacity: Int,
    val confirmedCount: Int,
    val waitlistCount: Int,
    val isAdmin: Boolean,
    val currentUserAttendee: AttendeeDTO?,
    val createdAt: Long,
    val updatedAt: Long 
)

data class AttendeesDTO(
    val confirmed: List<AttendeeDTO>,
    val waitlisted: List<AttendeeDTO>
)

data class RsvpRequestDTO(
    val name: String
)

data class RsvpResponseDTO(
    val status: String,
    val attendee: AttendeeDTO
)

data class CancelResponseDTO(
    val success: Boolean,
    val promoted: AttendeeDTO?
)

data class CreateEventRequestDTO(
    val title: String,
    val slug: String,
    val capacity: Int,
    val adminEmails: List<String> = emptyList()
)

data class UpdateCapacityRequestDTO(
    val capacity: Int
)

data class UpdateCapacityResponseDTO(
    val event: EventDetailDTO,
    val promoted: List<AttendeeDTO>,
    val demoted: List<AttendeeDTO>
)

data class AdminEmailRequestDTO(
    val adminEmail: String
)
