package io.eventlane.config

import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfiguration : WebSocketMessageBrokerConfigurer {

    override fun configureMessageBroker(registry: MessageBrokerRegistry) {
        // Enable a simple in-memory message broker
        registry.enableSimpleBroker("/topic")
        // Set application destination prefix for messages bound for @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app")
    }

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        // Register the /ws endpoint with SockJS fallback
        registry.addEndpoint("/ws")
            .setAllowedOrigins("http://localhost:4200", "https://eventlane.io")
            .withSockJS()
    }
}
