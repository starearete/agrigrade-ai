package com.agrigrade.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Email or mobile number is required")
    String emailOrMobile,

    @NotBlank(message = "Password is required")
    String password
) {}
