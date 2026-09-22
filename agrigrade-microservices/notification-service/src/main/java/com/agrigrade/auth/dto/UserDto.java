package com.agrigrade.auth.dto;

import java.util.List;

public record UserDto(
    Long id,
    String publicId,
    String fullName,
    String email,
    String mobileNumber,
    String status,
    List<String> roles,
    Boolean profileCompleted,
    String preferredLanguage,
    String preferredTheme,
    String createdAt
) {}
