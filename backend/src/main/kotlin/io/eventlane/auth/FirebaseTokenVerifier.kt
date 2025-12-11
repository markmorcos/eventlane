package io.eventlane.auth

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseToken
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class FirebaseTokenVerifier {

    private val logger = LoggerFactory.getLogger(javaClass)

    fun verifyToken(idToken: String): FirebaseToken? {
        return try {
            val decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken)
            logger.debug("Token verified for email: ${decodedToken.email}")
            decodedToken
        } catch (e: Exception) {
            logger.error("Failed to verify Firebase token: ${e.message}")
            null
        }
    }
}
