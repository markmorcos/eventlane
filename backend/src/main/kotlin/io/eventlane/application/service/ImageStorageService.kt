package io.eventlane.application.service

import io.minio.BucketExistsArgs
import io.minio.GetPresignedObjectUrlArgs
import io.minio.MakeBucketArgs
import io.minio.MinioClient
import io.minio.PutObjectArgs
import io.minio.RemoveObjectArgs
import io.minio.SetBucketPolicyArgs
import io.minio.http.Method
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.ByteArrayInputStream
import java.util.concurrent.TimeUnit

@Service
class ImageStorageService(
    private val minioClient: MinioClient,
    @Value("\${minio.endpoint}") private val endpoint: String,
    @Value("\${minio.bucket-name}") private val bucketName: String,
) {
    private val logger = LoggerFactory.getLogger(ImageStorageService::class.java)

    companion object {
        private const val DESKTOP_WIDTH = 1920
        private const val MOBILE_WIDTH = 640
        private const val PRESIGNED_URL_EXPIRY_MINUTES = 10L
    }

    @PostConstruct
    fun initializeBucket() {
        try {
            val exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build())

            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build())
                logger.info("Created MinIO bucket: $bucketName")
            }

            // Set public read policy for cover images
            val policy = """
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Effect": "Allow",
                      "Principal": {"AWS": "*"},
                      "Action": "s3:GetObject",
                      "Resource": "arn:aws:s3:::$bucketName/events/*/cover-*.webp"
                    }
                  ]
                }
            """.trimIndent()

            minioClient.setBucketPolicy(
                SetBucketPolicyArgs.builder()
                    .bucket(bucketName)
                    .config(policy)
                    .build(),
            )

            logger.info("MinIO bucket $bucketName configured successfully")
        } catch (e: Exception) {
            logger.error("Failed to initialize MinIO bucket", e)
        }
    }

    /**
     * Generate a presigned URL for direct upload to MinIO
     */
    fun generatePresignedUploadUrl(slug: String): String {
        val objectName = "events/$slug/cover-original.webp"

        return minioClient.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs.builder()
                .method(Method.PUT)
                .bucket(bucketName)
                .`object`(objectName)
                .expiry(PRESIGNED_URL_EXPIRY_MINUTES.toInt(), TimeUnit.MINUTES)
                .build(),
        )
    }

    /**
     * Get public URL for cover image
     */
    fun getPublicImageUrl(slug: String, size: String = "desktop"): String {
        val objectName = "events/$slug/cover-$size.webp"
        return "$endpoint/$bucketName/$objectName"
    }

    /**
     * Delete all cover images for an event
     */
    fun deleteEventImages(slug: String) {
        try {
            listOf("original", "desktop", "mobile").forEach { size ->
                val objectName = "events/$slug/cover-$size.webp"
                minioClient.removeObject(
                    RemoveObjectArgs.builder()
                        .bucket(bucketName)
                        .`object`(objectName)
                        .build(),
                )
            }
            logger.info("Deleted cover images for event: $slug")
        } catch (e: Exception) {
            logger.error("Failed to delete images for event: $slug", e)
            throw RuntimeException("Failed to delete event images", e)
        }
    }

    /**
     * Process uploaded image and generate optimized thumbnails
     * This is called after the client uploads the original via presigned URL
     */
    fun processUploadedImage(slug: String, file: MultipartFile): Map<String, String> {
        try {
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                throw IllegalArgumentException("File size exceeds 10MB limit")
            }

            // Validate content type
            val contentType = file.contentType
            if (contentType == null || !contentType.startsWith("image/")) {
                throw IllegalArgumentException("File must be an image")
            }

            // For WebP files from the image cropper, we trust the client-side processing
            // The frontend already ensures 16:9 aspect ratio and WebP format
            val imageBytes = file.bytes

            // Upload original
            uploadImage(imageBytes, "events/$slug/cover-original.webp", "image/webp")

            // For now, use the same image for all sizes
            uploadImage(imageBytes, "events/$slug/cover-desktop.webp", "image/webp")
            uploadImage(imageBytes, "events/$slug/cover-mobile.webp", "image/webp")

            return mapOf(
                "desktop" to getPublicImageUrl(slug, "desktop"),
                "mobile" to getPublicImageUrl(slug, "mobile"),
            )
        } catch (e: Exception) {
            logger.error("Failed to process image for event: $slug", e)
            throw RuntimeException("Failed to process image", e)
        }
    }

    private fun uploadImage(imageBytes: ByteArray, objectName: String, contentType: String) {
        minioClient.putObject(
            PutObjectArgs.builder()
                .bucket(bucketName)
                .`object`(objectName)
                .stream(ByteArrayInputStream(imageBytes), imageBytes.size.toLong(), -1)
                .contentType(contentType)
                .build(),
        )
    }
}
