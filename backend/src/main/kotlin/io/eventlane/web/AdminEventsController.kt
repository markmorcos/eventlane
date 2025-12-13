package io.eventlane.web

import io.eventlane.application.ports.EventRepository
import io.eventlane.application.ports.EventSeriesRepository
import io.eventlane.application.service.EventCommandService
import io.eventlane.application.service.EventSeriesCommandService
import io.eventlane.application.service.ImageStorageService
import io.eventlane.auth.SecurityUser
import io.eventlane.domain.model.EventDelta
import io.eventlane.domain.model.ForbiddenException
import io.eventlane.web.dto.DtoMapper
import io.eventlane.web.dto.UpdateCapacityRequestDto
import io.eventlane.web.dto.UpdateEventMetadataRequestDto
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.time.Instant
import java.time.format.DateTimeFormatter

@RestController
@RequestMapping("/api/admin/events/{slug}")
class AdminEventsController(
    private val repository: EventRepository,
    private val seriesRepository: EventSeriesRepository,
    private val commands: EventCommandService,
    private val seriesCommands: EventSeriesCommandService,
    private val imageStorage: ImageStorageService,
) {
    private fun ensureAdmin(slug: String, userEmail: String) {
        val event = repository.findBySlug(slug)
        val series = seriesRepository.findById(event.seriesId)
        if (!series.isAdmin(userEmail.lowercase())) {
            throw ForbiddenException("Only admins can perform this action.")
        }
    }

    @PostMapping("/capacity")
    fun updateCapacity(
        @PathVariable slug: String,
        @RequestBody body: UpdateCapacityRequestDto,
        @AuthenticationPrincipal user: SecurityUser,
    ): List<EventDelta> {
        ensureAdmin(slug, user.email)
        return commands.updateCapacity(slug, body.capacity)
    }

    @DeleteMapping
    fun deleteEvent(@PathVariable slug: String, @AuthenticationPrincipal user: SecurityUser): EventDelta {
        ensureAdmin(slug, user.email)
        return commands.deleteEvent(slug)
    }

    @PostMapping("/admins/{email}")
    fun addAdmin(
        @PathVariable slug: String,
        @PathVariable email: String,
        @AuthenticationPrincipal user: SecurityUser,
    ) {
        ensureAdmin(slug, user.email)
        val event = repository.findBySlug(slug)
        val series = seriesRepository.findById(event.seriesId)
        seriesCommands.addAdmin(series.slug, email)
    }

    @DeleteMapping("/admins/{email}")
    fun removeAdmin(
        @PathVariable slug: String,
        @PathVariable email: String,
        @AuthenticationPrincipal user: SecurityUser,
    ) {
        ensureAdmin(slug, user.email)
        val event = repository.findBySlug(slug)
        val series = seriesRepository.findById(event.seriesId)
        seriesCommands.removeAdmin(series.slug, email)
    }

    @PatchMapping("/metadata")
    fun updateMetadata(
        @PathVariable slug: String,
        @RequestBody request: UpdateEventMetadataRequestDto,
        @AuthenticationPrincipal user: SecurityUser,
    ): List<EventDelta> {
        ensureAdmin(slug, user.email)

        val deltas = mutableListOf<EventDelta>()

        if (request.timezone != null && request.eventDate != null) {
            val delta = commands.updateDateTime(
                slug,
                Instant.parse(request.eventDate),
                request.timezone,
            )
            deltas.add(delta)
        }

        if (request.clearLocation == true) {
            val delta = commands.updateLocation(slug, null)
            deltas.add(delta)
        } else if (request.location != null) {
            val delta = commands.updateLocation(slug, DtoMapper.fromLocationDto(request.location))
            deltas.add(delta)
        }

        if (request.description != null) {
            val delta = commands.updateDescription(slug, request.description)
            deltas.add(delta)
        }

        return deltas
    }

    @GetMapping("/cover-image/upload-url")
    fun getUploadUrl(@PathVariable slug: String, @AuthenticationPrincipal user: SecurityUser): Map<String, String> {
        ensureAdmin(slug, user.email)
        val url = imageStorage.generatePresignedUploadUrl(slug)
        return mapOf("uploadUrl" to url)
    }

    @PostMapping("/cover-image")
    fun processCoverImage(
        @PathVariable slug: String,
        @RequestParam("file") file: MultipartFile,
        @AuthenticationPrincipal user: SecurityUser,
    ): EventDelta {
        ensureAdmin(slug, user.email)

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw IllegalArgumentException("File size must not exceed 10MB")
        }

        // Validate file type
        val contentType = file.contentType ?: ""
        if (!contentType.startsWith("image/")) {
            throw IllegalArgumentException("File must be an image")
        }

        imageStorage.processUploadedImage(slug, file)

        return commands.updateCoverImage(slug, "events/$slug/cover")
    }

    @DeleteMapping("/cover-image")
    fun deleteCoverImage(@PathVariable slug: String, @AuthenticationPrincipal user: SecurityUser): EventDelta {
        ensureAdmin(slug, user.email)
        imageStorage.deleteEventImages(slug)
        return commands.updateCoverImage(slug, null)
    }

    @GetMapping("/attendees.csv")
    fun exportAttendeesCSV(
        @PathVariable slug: String,
        @AuthenticationPrincipal user: SecurityUser,
        response: HttpServletResponse,
    ) {
        ensureAdmin(slug, user.email)

        val event = repository.findBySlug(slug)

        response.contentType = "text/csv"
        response.setHeader("Content-Disposition", "attachment; filename=\"$slug-attendees.csv\"")

        val writer = response.writer

        // CSV Header
        writer.write("name,email,status,joinedAt\n")

        // Write all attendees
        event.attendees.sortedBy { it.joinedAt }.forEach { attendee ->
            val joinedAtFormatted = DateTimeFormatter.ISO_INSTANT.format(attendee.joinedAt)
            writer.write(
                "\"${escapeCsv(
                    attendee.name,
                )}\",\"${escapeCsv(attendee.email)}\",${attendee.status},$joinedAtFormatted\n",
            )
        }

        writer.flush()
    }

    private fun escapeCsv(value: String): String {
        return value.replace("\"", "\"\"")
    }
}
