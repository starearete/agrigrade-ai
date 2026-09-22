package com.agrigrade.ai.entity;

import com.agrigrade.batch.entity.ProductBatch;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_certificates")
public class AiCertificate {

    public enum Status {
        ISSUED, REVOKED, EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "certificate_number", nullable = false, unique = true, length = 60)
    private String certificateNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private ProductBatch batch;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quality_result_id", nullable = false)
    private QualityResult qualityResult;

    @Column(name = "model_id")
    private Long modelId = 1L;

    @Column(name = "digital_signature", length = 64)
    private String digitalSignature;

    @Column(name = "certificate_pdf_url", length = 500)
    private String certificatePdfUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.ISSUED;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    public AiCertificate() {
    }

    @PrePersist
    public void onCreate() {
        if (this.issuedAt == null) {
            this.issuedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCertificateNumber() {
        return certificateNumber;
    }

    public void setCertificateNumber(String certificateNumber) {
        this.certificateNumber = certificateNumber;
    }

    public ProductBatch getBatch() {
        return batch;
    }

    public void setBatch(ProductBatch batch) {
        this.batch = batch;
    }

    public QualityResult getQualityResult() {
        return qualityResult;
    }

    public void setQualityResult(QualityResult qualityResult) {
        this.qualityResult = qualityResult;
    }

    public Long getModelId() {
        return modelId;
    }

    public void setModelId(Long modelId) {
        this.modelId = modelId;
    }

    public String getDigitalSignature() {
        return digitalSignature;
    }

    public void setDigitalSignature(String digitalSignature) {
        this.digitalSignature = digitalSignature;
    }

    public String getCertificatePdfUrl() {
        return certificatePdfUrl;
    }

    public void setCertificatePdfUrl(String certificatePdfUrl) {
        this.certificatePdfUrl = certificatePdfUrl;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(LocalDateTime issuedAt) {
        this.issuedAt = issuedAt;
    }
}
