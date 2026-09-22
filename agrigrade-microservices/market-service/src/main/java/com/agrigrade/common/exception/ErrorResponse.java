package com.agrigrade.common.exception;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
    String timestamp,
    int status,
    String code,
    String message,
    String path,
    List<String> fieldErrors
) {
    public ErrorResponse(int status, String code, String message, String path, List<String> fieldErrors) {
        this(Instant.now().toString(), status, code, message, path, fieldErrors);
    }

    public ErrorResponse(int status, String code, String message, String path) {
        this(Instant.now().toString(), status, code, message, path, List.of());
    }
}
