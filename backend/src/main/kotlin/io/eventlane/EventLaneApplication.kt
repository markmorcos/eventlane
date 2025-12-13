package io.eventlane

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.mongodb.config.EnableMongoAuditing
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableMongoAuditing
@EnableScheduling
class EventLaneApplication

fun main(args: Array<String>) {
    runApplication<EventLaneApplication>(*args)
}
