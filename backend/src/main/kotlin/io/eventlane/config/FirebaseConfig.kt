package io.eventlane.config

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import java.io.FileInputStream

@Configuration
class FirebaseConfig {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    @Value("\${firebase.project-id}")
    private lateinit var projectId: String
    
    @Value("\${firebase.credentials-path:}")
    private var credentialsPath: String? = null
    
    @PostConstruct
    fun initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                val options = if (!credentialsPath.isNullOrBlank()) {
                    FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(FileInputStream(credentialsPath)))
                        .setProjectId(projectId)
                        .build()
                } else {
                    // Use default credentials (for local dev with gcloud or production)
                    FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.getApplicationDefault())
                        .setProjectId(projectId)
                        .build()
                }
                
                FirebaseApp.initializeApp(options)
                logger.info("Firebase initialized successfully for project: $projectId")
            }
        } catch (e: Exception) {
            logger.error("Failed to initialize Firebase: ${e.message}")
            // For development, we'll continue without Firebase
            logger.warn("Continuing without Firebase authentication")
        }
    }
}
