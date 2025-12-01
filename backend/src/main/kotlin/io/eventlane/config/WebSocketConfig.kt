package io.eventlane.config

import com.corundumstudio.socketio.Configuration
import com.corundumstudio.socketio.SocketIOServer
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.stereotype.Component
import jakarta.annotation.PreDestroy
import org.slf4j.LoggerFactory

@Component
class SocketIOConfig(
    @Value("\${socket.port:8081}") private val port: Int,
    @Value("\${socket.host:0.0.0.0}") private val host: String
) {
    
    private val logger = LoggerFactory.getLogger(SocketIOConfig::class.java)
    private var server: SocketIOServer? = null
    
    @Bean
    fun socketIOServer(): SocketIOServer {
        val config = Configuration()
        config.hostname = host
        config.port = port
        
        // CORS configuration
        config.origin = "http://localhost:4200"
        
        server = SocketIOServer(config)
        
        // Connection event handler
        server?.addConnectListener { client ->
            logger.info("Client connected: ${client.sessionId}")
        }
        
        // Disconnection event handler
        server?.addDisconnectListener { client ->
            logger.info("Client disconnected: ${client.sessionId}")
        }
        
        // Join room event handler
        server?.addEventListener("join-room", String::class.java) { client, roomName, _ ->
            logger.info("Client ${client.sessionId} joining room: $roomName")
            client.joinRoom(roomName)
            logger.info("Client ${client.sessionId} joined room: $roomName successfully. Client rooms: ${client.allRooms}")
        }
        
        // Leave room event handler
        server?.addEventListener("leave-room", String::class.java) { client, roomName, _ ->
            logger.info("Client ${client.sessionId} leaving room: $roomName")
            client.leaveRoom(roomName)
        }
        
        server?.start()
        logger.info("Socket.IO server started on $host:$port")
        
        return server!!
    }
    
    @PreDestroy
    fun stopSocketIOServer() {
        logger.info("Stopping Socket.IO server")
        server?.stop()
    }
}
