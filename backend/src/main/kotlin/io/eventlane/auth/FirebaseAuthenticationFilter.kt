package io.eventlane.auth

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class FirebaseAuthenticationFilter(
    private val tokenVerifier: FirebaseTokenVerifier,
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val authHeader = request.getHeader("Authorization")

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            val idToken = authHeader.substring(7)
            val decodedToken = tokenVerifier.verifyToken(idToken)

            if (decodedToken != null && decodedToken.isEmailVerified()) {
                val user = SecurityUser(email = decodedToken.email)
                val authentication = UsernamePasswordAuthenticationToken(
                    user,
                    null,
                    user.authorities,
                )

                SecurityContextHolder.getContext().authentication = authentication
            }
        }

        filterChain.doFilter(request, response)
    }
}
