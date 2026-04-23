package com.example.pixel_project2.upload.service;

import com.example.pixel_project2.config.r2.R2Properties;
import com.example.pixel_project2.upload.dto.StoredFile;
import com.example.pixel_project2.upload.dto.StoredImage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class R2StorageService {
    private static final long MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
    private static final long MAX_MESSAGE_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );
    private static final Map<String, String> EXTENSIONS_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/gif", "gif"
    );
    private static final Set<String> BLOCKED_MESSAGE_ATTACHMENT_EXTENSIONS = Set.of(
            "bat",
            "cmd",
            "com",
            "exe",
            "jar",
            "js",
            "msi",
            "ps1",
            "scr",
            "sh",
            "vbs"
    );

    private final R2Properties properties;
    private volatile S3Client s3Client;

    public StoredImage uploadImage(MultipartFile file, String prefix) {
        validateConfigured();
        validateImage(file);

        String contentType = normalizeContentType(file.getContentType());
        String key = buildKey(prefix, contentType);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.getBucketName())
                .key(key)
                .contentType(contentType)
                .cacheControl("public, max-age=31536000, immutable")
                .build();

        try {
            getClient().putObject(
                    request,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read image file.");
        }

        return new StoredImage(key, buildPublicUrl(key), contentType, file.getSize());
    }

    public StoredFile uploadMessageAttachment(MultipartFile file, String prefix) {
        validateConfigured();
        validateMessageAttachment(file);

        String contentType = normalizeContentType(file.getContentType());
        if (contentType.isBlank()) {
            contentType = "application/octet-stream";
        }
        String originalFilename = normalizeOriginalFilename(file.getOriginalFilename());
        String key = buildKey(prefix, originalFilename, contentType);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.getBucketName())
                .key(key)
                .contentType(contentType)
                .cacheControl("public, max-age=31536000, immutable")
                .build();

        try {
            getClient().putObject(
                    request,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read attachment file.");
        }

        return new StoredFile(key, buildPublicUrl(key), contentType, file.getSize(), originalFilename);
    }

    private S3Client getClient() {
        S3Client currentClient = s3Client;
        if (currentClient != null) {
            return currentClient;
        }

        synchronized (this) {
            if (s3Client == null) {
                s3Client = S3Client.builder()
                        .endpointOverride(URI.create(properties.getEndpoint().trim()))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(
                                        properties.getAccessKeyId().trim(),
                                        properties.getSecretAccessKey().trim()
                                )
                        ))
                        .region(Region.of("auto"))
                        .forcePathStyle(true)
                        .build();
            }
            return s3Client;
        }
    }

    private void validateConfigured() {
        if (isBlank(properties.getEndpoint())
                || isBlank(properties.getAccessKeyId())
                || isBlank(properties.getSecretAccessKey())
                || isBlank(properties.getBucketName())
                || isBlank(properties.getPublicUrl())) {
            throw new IllegalArgumentException("R2 storage is not configured.");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required.");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Image must be 10MB or smaller.");
        }

        String contentType = normalizeContentType(file.getContentType());
        if (!ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPG, PNG, WebP, and GIF images can be uploaded.");
        }
    }

    private void validateMessageAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Attachment file is required.");
        }
        if (file.getSize() > MAX_MESSAGE_ATTACHMENT_SIZE_BYTES) {
            throw new IllegalArgumentException("Attachment must be 10MB or smaller.");
        }

        String extension = extractExtension(file.getOriginalFilename());
        if (BLOCKED_MESSAGE_ATTACHMENT_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("This file type cannot be attached.");
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "";
        }
        return contentType.trim().toLowerCase();
    }

    private String buildKey(String prefix, String contentType) {
        String normalizedPrefix = prefix == null ? "" : prefix.trim();
        normalizedPrefix = normalizedPrefix.replace("\\", "/");
        normalizedPrefix = normalizedPrefix.replaceAll("^/+", "").replaceAll("/+$", "");

        String extension = EXTENSIONS_BY_CONTENT_TYPE.getOrDefault(contentType, "bin");
        String filename = UUID.randomUUID() + "." + extension;

        return normalizedPrefix.isBlank() ? filename : normalizedPrefix + "/" + filename;
    }

    private String buildKey(String prefix, String originalFilename, String contentType) {
        String normalizedPrefix = prefix == null ? "" : prefix.trim();
        normalizedPrefix = normalizedPrefix.replace("\\", "/");
        normalizedPrefix = normalizedPrefix.replaceAll("^/+", "").replaceAll("/+$", "");

        String extension = extractExtension(originalFilename);
        if (extension.isBlank()) {
            extension = EXTENSIONS_BY_CONTENT_TYPE.getOrDefault(contentType, "bin");
        }
        String filename = UUID.randomUUID() + "." + extension;

        return normalizedPrefix.isBlank() ? filename : normalizedPrefix + "/" + filename;
    }

    private String normalizeOriginalFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "attachment";
        }
        String normalized = originalFilename.replace("\\", "/");
        int lastSlashIndex = normalized.lastIndexOf('/');
        if (lastSlashIndex >= 0) {
            normalized = normalized.substring(lastSlashIndex + 1);
        }
        return normalized.isBlank() ? "attachment" : normalized;
    }

    private String extractExtension(String filename) {
        String normalizedFilename = normalizeOriginalFilename(filename);
        int dotIndex = normalizedFilename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == normalizedFilename.length() - 1) {
            return "";
        }
        return normalizedFilename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private String buildPublicUrl(String key) {
        return properties.getPublicUrl().replaceAll("/+$", "") + "/" + key;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
