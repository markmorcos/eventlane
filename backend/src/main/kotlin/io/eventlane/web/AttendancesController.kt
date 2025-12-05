package io.eventlane.web

import io.eventlane.application.service.AttendanceService
import io.eventlane.auth.SecurityUser
import io.eventlane.domain.model.AttendeeAdded
import io.eventlane.web.dto.AttendanceRequestDto
import io.eventlane.web.dto.AttendanceResponseDto
import io.eventlane.web.dto.DtoMapper
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/attendances/{slug}")
class AttendancesController(private val attendance: AttendanceService) {
    @PostMapping("/attend")
    fun attend(
        @PathVariable slug: String,
        @RequestBody body: AttendanceRequestDto,
        @AuthenticationPrincipal user: SecurityUser,
    ): AttendanceResponseDto {
        val delta = attendance.attend(
            slug = slug,
            userId = user.uid,
            name = body.name,
            email = user.email,
        )

        val attendee = (delta as AttendeeAdded).attendee

        return AttendanceResponseDto(
            status = delta.status.name,
            attendee = DtoMapper.toAttendeeDto(attendee),
        )
    }

    @DeleteMapping("/attend/{email}")
    fun cancel(
        @PathVariable slug: String,
        @PathVariable email: String,
        @AuthenticationPrincipal user: SecurityUser,
    ): Boolean {
        attendance.cancel(slug, email, user.email)
        return true
    }
}
