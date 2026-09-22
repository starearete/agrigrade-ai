package com.agrigrade.auth.dto;

public record LoginResponse(
    String token,
    String refreshToken,
    UserDto user
) {}
