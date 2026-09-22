package com.agrigrade.ai.dto;

public record AiAnalysisResponse(
    Long batchId,
    String status,
    CropClassificationResult classification,
    AiAnalysisDto aiAnalysis,
    AiCertificateDto certificate
) {
    public record AiAnalysisDto(
        String status,
        Double qualityScore,
        String qualityGrade
    ) {}

    public record AiCertificateDto(
        String certificateNumber,
        String status,
        String issuedAt,
        String digitalSignature
    ) {}
}
