package io.eventlane.domain.util

import java.security.SecureRandom

object SlugGenerator {
    private val RANDOM = SecureRandom()
    private val CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"

    fun toSlug(text: String): String {
        return text
            .lowercase()
            .trim()
            .replace(Regex("[^a-z0-9\\s-]"), "")
            .replace(Regex("\\s+"), "-")
            .replace(Regex("-+"), "-")
            .removePrefix("-")
            .removeSuffix("-")
            .take(50)
    }

    fun generateUniqueSlug(baseText: String, existsCheck: (String) -> Boolean): String {
        val baseSlug = toSlug(baseText)

        if (!existsCheck(baseSlug)) {
            return baseSlug
        }

        // Try with random suffix (4 characters)
        var attempts = 0
        while (attempts < 100) {
            val randomSuffix = generateRandomString(4)
            val candidateSlug = "$baseSlug-$randomSuffix"

            if (!existsCheck(candidateSlug)) {
                return candidateSlug
            }

            attempts++
        }

        // Fallback: use timestamp
        val timestamp = System.currentTimeMillis().toString().takeLast(8)
        return "$baseSlug-$timestamp"
    }

    private fun generateRandomString(length: Int): String {
        return (1..length)
            .map { CHARS[RANDOM.nextInt(CHARS.length)] }
            .joinToString("")
    }
}
