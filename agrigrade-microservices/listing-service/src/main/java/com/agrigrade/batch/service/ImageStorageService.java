package com.agrigrade.batch.service;

import com.agrigrade.common.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageStorageService {

    private final Path rootUploadDir;

    private static final Set<String> ALLOWED_IMAGE_MIMES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    private static final Set<String> ALLOWED_VIDEO_MIMES = Set.of(
            "video/mp4",
            "video/webm",
            "video/quicktime"
    );

    public record StoredFileResult(
            String storageKey,
            String mimeType,
            long fileSizeBytes,
            String sha256Hash
    ) {}

    public ImageStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.rootUploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootUploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload folder: " + uploadDir, e);
        }
    }

    public StoredFileResult storeBatchFile(Long batchId, MultipartFile file, String mediaType) {
        if (file == null || file.isEmpty() || file.getSize() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_FILE", "Uploaded file cannot be empty or 0 bytes.");
        }

        String rawContentType = file.getContentType();
        String mimeType = rawContentType != null ? rawContentType.toLowerCase().trim() : "application/octet-stream";

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg");
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        } else {
            if (mimeType.contains("png")) extension = ".png";
            else if (mimeType.contains("webp")) extension = ".webp";
            else if (mimeType.contains("mp4")) extension = ".mp4";
            else extension = ".jpg";
        }

        boolean isVideo = "VIDEO".equalsIgnoreCase(mediaType) || mimeType.startsWith("video/");
        if (isVideo) {
            if (!ALLOWED_VIDEO_MIMES.contains(mimeType) && !extension.equals(".mp4")) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_FILE_TYPE", "Invalid video format: " + mimeType + ". Allowed: MP4, WebM.");
            }
        } else {
            if (!ALLOWED_IMAGE_MIMES.contains(mimeType) && !extension.equals(".jpg") && !extension.equals(".jpeg") && !extension.equals(".png") && !extension.equals(".webp")) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_FILE_TYPE", "Invalid image format: " + mimeType + ". Allowed: JPG, PNG, WEBP.");
            }
            if (mimeType.equals("application/octet-stream")) {
                if (extension.equals(".png")) mimeType = "image/png";
                else if (extension.equals(".webp")) mimeType = "image/webp";
                else mimeType = "image/jpeg";
            }
        }

        try {
            // Compute SHA-256 directly from file bytes
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] fileBytes = file.getBytes();
            byte[] hashBytes = digest.digest(fileBytes);
            String sha256Hash = HexFormat.of().formatHex(hashBytes);

            // Create batch directory: uploads/batches/{batchId}
            Path batchDir = this.rootUploadDir.resolve("batches").resolve(String.valueOf(batchId)).normalize();
            Files.createDirectories(batchDir);

            // Create unique file name: {uuid}{extension}
            String uniqueName = UUID.randomUUID().toString().replace("-", "") + extension;
            Path targetPath = batchDir.resolve(uniqueName).normalize();

            // Prevent path traversal
            if (!targetPath.startsWith(this.rootUploadDir)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "SECURITY_ERROR", "Cannot store file outside current directory.");
            }

            Files.write(targetPath, fileBytes);

            // Relative storage key (e.g. uploads/batches/55/abc123.jpg)
            String storageKey = "uploads/batches/" + batchId + "/" + uniqueName;

            return new StoredFileResult(storageKey, mimeType, file.getSize(), sha256Hash);

        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_STORAGE_ERROR", "Failed to store uploaded file: " + e.getMessage());
        }
    }

    public Resource loadFileAsResource(String storageKey) {
        try {
            Path filePath = resolveStoragePath(storageKey);
            Resource resource = new FileSystemResource(filePath);
            if (resource.exists() && resource.isReadable() && Files.size(filePath) > 200) {
                return resource;
            } else {
                throw new ApiException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "File not found or invalid byte size: " + storageKey);
            }
        } catch (Exception ex) {
            if (ex instanceof ApiException) throw (ApiException) ex;
            throw new ApiException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "File not found: " + storageKey);
        }
    }

    public Path resolveStoragePath(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "INVALID_STORAGE_KEY", "Storage key cannot be blank.");
        }

        // Normalize relative path if it starts with "uploads/"
        String relative = storageKey.replace('\\', '/');
        if (relative.startsWith("uploads/")) {
            relative = relative.substring("uploads/".length());
        }

        Path path = this.rootUploadDir.resolve(relative).normalize();
        if (!path.startsWith(this.rootUploadDir)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SECURITY_ERROR", "Access denied.");
        }
        return path;
    }

    public void deleteFile(String storageKey) {
        try {
            Path path = resolveStoragePath(storageKey);
            Files.deleteIfExists(path);
        } catch (Exception ignored) {}
    }

    public void deleteBatchDirectory(Long batchId) {
        try {
            Path batchDir = this.rootUploadDir.resolve("batches").resolve(String.valueOf(batchId)).normalize();
            if (Files.exists(batchDir)) {
                try (var stream = Files.walk(batchDir)) {
                    stream.sorted(Comparator.reverseOrder())
                            .forEach(p -> {
                                try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                            });
                }
            }
        } catch (Exception ignored) {}
    }
}
