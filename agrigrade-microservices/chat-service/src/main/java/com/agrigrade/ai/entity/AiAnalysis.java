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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_analyses")
public class AiAnalysis {

    public enum Status {
        PENDING, PROCESSING, COMPLETED, FAILED, REJECTED
    }

    public enum AnalysisType {
        QUALITY_GRADING, DISEASE_DETECTION, FULL_INSPECTION
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private ProductBatch batch;

    @Column(name = "model_id")
    private Long modelId = 1L;

    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_type", nullable = false)
    private AnalysisType analysisType = AnalysisType.FULL_INSPECTION;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "overall_confidence", precision = 5, scale = 2)
    private BigDecimal overallConfidence;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "inspection_locked", nullable = false)
    private Boolean inspectionLocked = false;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    public AiAnalysis() {
    }

    @PrePersist
    public void onCreate() {
        if (this.startedAt == null) {
            this.startedAt = LocalDateTime.now();
        }
        if (this.inspectionLocked == null) {
            this.inspectionLocked = false;
        }
    }

    public Boolean getInspectionLocked() {
        return inspectionLocked != null ? inspectionLocked : false;
    }

    public Boolean isInspectionLocked() {
        return Boolean.TRUE.equals(this.inspectionLocked);
    }

    public void setInspectionLocked(Boolean inspectionLocked) {
        this.inspectionLocked = inspectionLocked;
    }

    public LocalDateTime getLockedAt() {
        return lockedAt;
    }

    public void setLockedAt(LocalDateTime lockedAt) {
        this.lockedAt = lockedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ProductBatch getBatch() {
        return batch;
    }

    public void setBatch(ProductBatch batch) {
        this.batch = batch;
    }

    public Long getModelId() {
        return modelId;
    }

    public void setModelId(Long modelId) {
        this.modelId = modelId;
    }

    public AnalysisType getAnalysisType() {
        return analysisType;
    }

    public void setAnalysisType(AnalysisType analysisType) {
        this.analysisType = analysisType;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public BigDecimal getOverallConfidence() {
        return overallConfidence;
    }

    public void setOverallConfidence(BigDecimal overallConfidence) {
        this.overallConfidence = overallConfidence;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
