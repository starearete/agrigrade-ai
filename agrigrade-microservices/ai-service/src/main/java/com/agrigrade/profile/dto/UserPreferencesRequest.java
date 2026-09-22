package com.agrigrade.profile.dto;

public record UserPreferencesRequest(
    String preferredLanguage,
    String preferredTheme
) {}
