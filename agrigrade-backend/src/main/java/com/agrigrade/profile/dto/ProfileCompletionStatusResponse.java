package com.agrigrade.profile.dto;

import java.util.List;

public record ProfileCompletionStatusResponse(
    Boolean completed,
    String role,
    List<String> missingFields,
    String preferredLanguage,
    String preferredTheme
) {}
