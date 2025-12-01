package io.eventlane

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.mongodb.config.EnableMongoAuditing

@SpringBootApplication
@EnableMongoAuditing
class RsvpApplication

fun main(args: Array<String>) {
    runApplication<RsvpApplication>(*args)
}
