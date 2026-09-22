package com.agrigrade.ai.service;

import com.agrigrade.ai.dto.AiAnalysisResponse;
import com.agrigrade.ai.dto.CropClassificationResult;
import com.agrigrade.ai.dto.RunAiAnalysisRequest;
import com.agrigrade.ai.entity.AiAnalysis;
import com.agrigrade.ai.entity.AiCertificate;
import com.agrigrade.ai.entity.QualityResult;
import com.agrigrade.ai.repository.AiAnalysisRepository;
import com.agrigrade.ai.repository.AiCertificateRepository;
import com.agrigrade.ai.repository.QualityResultRepository;
import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.batch.entity.BatchImage;
import com.agrigrade.batch.entity.ProductBatch;
import com.agrigrade.batch.repository.BatchImageRepository;
import com.agrigrade.batch.repository.ProductBatchRepository;
import com.agrigrade.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.HexFormat;
import java.util.Random;

@Service
public class AiAnalysisService {

    private final UserRepository userRepository;
    private final ProductBatchRepository productBatchRepository;
    private final BatchImageRepository batchImageRepository;
    private final AiAnalysisRepository aiAnalysisRepository;
    private final QualityResultRepository qualityResultRepository;
    private final AiCertificateRepository aiCertificateRepository;
    private final CropClassificationService cropClassificationService;

    public AiAnalysisService(
        UserRepository userRepository,
        ProductBatchRepository productBatchRepository,
        BatchImageRepository batchImageRepository,
        AiAnalysisRepository aiAnalysisRepository,
        QualityResultRepository qualityResultRepository,
        AiCertificateRepository aiCertificateRepository,
        CropClassificationService cropClassificationService
    ) {
        this.userRepository = userRepository;
        this.productBatchRepository = productBatchRepository;
        this.batchImageRepository = batchImageRepository;
        this.aiAnalysisRepository = aiAnalysisRepository;
        this.qualityResultRepository = qualityResultRepository;
        this.aiCertificateRepository = aiCertificateRepository;
        this.cropClassificationService = cropClassificationService;
    }

    @Transactional
    public AiAnalysisResponse runAiAnalysis(String userPublicId, Long batchId, RunAiAnalysisRequest request) {
        User user = userRepository.findByPublicId(userPublicId)
            .orElseGet(() -> userRepository.findFirstByEmailIgnoreCaseOrMobileNumber(userPublicId, userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found.")));

        ProductBatch batch = productBatchRepository.findById(batchId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BATCH_NOT_FOUND", "Product batch not found."));

        if (batch.isInspectionLocked() || "LISTED".equalsIgnoreCase(batch.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "INSPECTION_LOCKED", "This AI-inspected batch has been published to the marketplace and is permanently locked.");
        }

        if (batch.getFarmer() != null && !user.getId().equals(batch.getFarmer().getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You do not own this product batch.");
        }

        List<BatchImage> images = batchImageRepository.findByBatchIdOrderBySequenceNoAsc(batchId);
        List<BatchImage> photos = images.stream()
            .filter(img -> "PHOTO".equalsIgnoreCase(img.getMediaType()))
            .toList();

        if (photos.isEmpty()) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "NO_PRODUCT_IMAGES",
                "Upload at least one product image before running AI inspection."
            );
        }

        BatchImage primaryPhoto = photos.get(0);
        String expectedCrop = "Tomato";
        if (batch.getVariety() != null && batch.getVariety().getCrop() != null) {
            expectedCrop = batch.getVariety().getCrop().getName();
        }

        boolean simulateMismatch = request != null && Boolean.TRUE.equals(request.simulateCropMismatch());
        CropClassificationResult classificationResult = cropClassificationService.classifyCrop(primaryPhoto, expectedCrop, simulateMismatch);

        if (!Boolean.TRUE.equals(classificationResult.isMatch())) {
            AiAnalysis failedAnalysis = new AiAnalysis();
            failedAnalysis.setBatch(batch);
            failedAnalysis.setModelId(1L);
            failedAnalysis.setStatus(AiAnalysis.Status.FAILED);
            failedAnalysis.setStartedAt(LocalDateTime.now());
            failedAnalysis.setCompletedAt(LocalDateTime.now());
            failedAnalysis.setRejectionReason("CROP_MISMATCH: Detected " + classificationResult.detectedCropName() + ", expected " + expectedCrop);
            aiAnalysisRepository.save(failedAnalysis);

            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "CROP_MISMATCH",
                "The uploaded image appears to contain " + classificationResult.detectedCropName() + ", but the selected crop is " + expectedCrop + "."
            );
        }

        if (request != null && Boolean.TRUE.equals(request.simulateLowConfidence())) {
            AiAnalysis failedAnalysis = new AiAnalysis();
            failedAnalysis.setBatch(batch);
            failedAnalysis.setModelId(1L);
            failedAnalysis.setStatus(AiAnalysis.Status.FAILED);
            failedAnalysis.setStartedAt(LocalDateTime.now());
            failedAnalysis.setCompletedAt(LocalDateTime.now());
            failedAnalysis.setRejectionReason("LOW_CONFIDENCE: Overall confidence score below required threshold.");
            aiAnalysisRepository.save(failedAnalysis);

            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "LOW_CONFIDENCE",
                "AI inspection confidence score is too low for certification."
            );
        }

        // Successful Inspection Workflow
        AiAnalysis aiAnalysis = new AiAnalysis();
        aiAnalysis.setBatch(batch);
        aiAnalysis.setModelId(1L);
        aiAnalysis.setStatus(AiAnalysis.Status.COMPLETED);
        aiAnalysis.setAnalysisType(AiAnalysis.AnalysisType.FULL_INSPECTION);
        aiAnalysis.setStartedAt(LocalDateTime.now().minusSeconds(5));
        aiAnalysis.setCompletedAt(LocalDateTime.now());
        aiAnalysis.setOverallConfidence(BigDecimal.valueOf(classificationResult.confidenceScore()));
        AiAnalysis savedAnalysis = aiAnalysisRepository.save(aiAnalysis);

        QualityResult qualityResult = new QualityResult();
        qualityResult.setAnalysis(savedAnalysis);

        QualityResult.AssignedGrade targetGrade = QualityResult.AssignedGrade.GRADE_A_PREMIUM;
        double targetScore = 95.00;
        if (request != null && request.simulateGrade() != null) {
            String sg = request.simulateGrade().toUpperCase();
            if (sg.equals("GRADE_A") || sg.equals("A") || sg.equals("GRADE_A_STANDARD")) {
                targetGrade = QualityResult.AssignedGrade.GRADE_A;
                targetScore = 90.00;
            } else if (sg.contains("GRADE_B") || sg.equals("B")) {
                targetGrade = QualityResult.AssignedGrade.GRADE_B_STANDARD;
                targetScore = 82.00;
            } else if (sg.contains("GRADE_C") || sg.equals("C")) {
                targetGrade = QualityResult.AssignedGrade.GRADE_C_COMMERCIAL;
                targetScore = 68.00;
            } else if (sg.contains("REJECT")) {
                targetGrade = QualityResult.AssignedGrade.REJECTED;
                targetScore = 45.00;
            }
        }

        qualityResult.setAssignedGrade(targetGrade);
        qualityResult.setQualityScore(BigDecimal.valueOf(targetScore));
        qualityResult.setMoisturePercent(BigDecimal.valueOf(12.50));
        qualityResult.setUniformityScore(BigDecimal.valueOf(94.00));
        qualityResult.setColorPurityScore(BigDecimal.valueOf(96.00));
        qualityResult.setCalculatedAt(LocalDateTime.now());
        QualityResult savedQuality = qualityResultRepository.save(qualityResult);

        int randomSeq = 10000 + new Random().nextInt(90000);
        String certNum = "AGRI-CERT-" + Year.now().getValue() + "-" + randomSeq;

        AiCertificate certificate = aiCertificateRepository.findByBatchId(batch.getId())
                .orElseGet(() -> {
                    AiCertificate c = new AiCertificate();
                    c.setBatch(batch);
                    return c;
                });
        certificate.setModelId(1L);
        certificate.setQualityResult(savedQuality);
        certificate.setCertificateNumber(certNum);
        certificate.setDigitalSignature(generateDigitalSignature(certNum + "-" + batch.getId()));
        certificate.setStatus(AiCertificate.Status.ISSUED);
        certificate.setIssuedAt(LocalDateTime.now());
        AiCertificate savedCertificate = aiCertificateRepository.save(certificate);

        batch.setStatus("AI_GRADED");
        productBatchRepository.save(batch);

        return mapToResponse(batch.getId(), classificationResult, savedAnalysis, savedQuality, savedCertificate);
    }

    @Transactional(readOnly = true)
    public AiAnalysisResponse getBatchAiAnalysis(Long batchId) {
        ProductBatch batch = productBatchRepository.findById(batchId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BATCH_NOT_FOUND", "Product batch not found."));

        AiAnalysis aiAnalysis = aiAnalysisRepository.findFirstByBatchIdAndStatusOrderByStartedAtDesc(batchId, AiAnalysis.Status.COMPLETED)
            .orElseGet(() -> aiAnalysisRepository.findFirstByBatchIdOrderByStartedAtDesc(batchId).orElse(null));

        if (aiAnalysis == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ANALYSIS_NOT_FOUND", "No AI analysis found for this batch.");
        }

        QualityResult qualityResult = qualityResultRepository.findByAnalysisId(aiAnalysis.getId()).orElse(null);
        AiCertificate certificate = aiCertificateRepository.findFirstByBatchIdAndStatusOrderByIssuedAtDesc(batchId, AiCertificate.Status.ISSUED)
            .orElseGet(() -> aiCertificateRepository.findFirstByBatchIdOrderByIssuedAtDesc(batchId).orElse(null));

        String expectedCrop = "Tomato";
        if (batch.getVariety() != null && batch.getVariety().getCrop() != null) {
            expectedCrop = batch.getVariety().getCrop().getName();
        }

        CropClassificationResult classification = new CropClassificationResult(
            expectedCrop,
            aiAnalysis.getOverallConfidence() != null ? aiAnalysis.getOverallConfidence().doubleValue() : 95.0,
            aiAnalysis.getStatus() == AiAnalysis.Status.COMPLETED
        );

        return mapToResponse(batchId, classification, aiAnalysis, qualityResult, certificate);
    }

    private AiAnalysisResponse mapToResponse(
        Long batchId,
        CropClassificationResult classification,
        AiAnalysis aiAnalysis,
        QualityResult qualityResult,
        AiCertificate certificate
    ) {
        AiAnalysisResponse.AiAnalysisDto analysisDto = aiAnalysis != null ? new AiAnalysisResponse.AiAnalysisDto(
            aiAnalysis.getStatus().name(),
            qualityResult != null && qualityResult.getQualityScore() != null ? qualityResult.getQualityScore().doubleValue() : 95.0,
            qualityResult != null && qualityResult.getAssignedGrade() != null ? qualityResult.getAssignedGrade().name() : "GRADE_A_PREMIUM"
        ) : null;

        AiAnalysisResponse.AiCertificateDto certDto = certificate != null ? new AiAnalysisResponse.AiCertificateDto(
            certificate.getCertificateNumber(),
            certificate.getStatus().name(),
            certificate.getIssuedAt() != null ? certificate.getIssuedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "",
            certificate.getDigitalSignature()
        ) : null;

        return new AiAnalysisResponse(
            batchId,
            aiAnalysis != null ? aiAnalysis.getStatus().name() : "NONE",
            classification,
            analysisDto,
            certDto
        );
    }

    private String generateDigitalSignature(String rawInput) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawInput.getBytes("UTF-8"));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "SIG-" + System.currentTimeMillis();
        }
    }
}
