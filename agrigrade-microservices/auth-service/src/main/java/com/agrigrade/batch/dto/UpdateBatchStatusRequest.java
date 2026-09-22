package com.agrigrade.batch.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateBatchStatusRequest(
    @NotBlank(message = "Status is required")
    String status
) {}
