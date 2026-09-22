package com.agrigrade.ai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "quality_results")
public class QualityResult {

    public enum AssignedGrade {
        GRADE_A_PREMIUM, GRADE_A, GRADE_B_STANDARD, GRADE_B, GRADE_C_COMMERCIAL, GRADE_C, REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = false)
    private AiAnalysis analysis;

    @Enumerated(EnumType.STRING)
    @Column(name = "assigned_grade", nullable = false)
    private AssignedGrade assignedGrade;

    @Column(name = "quality_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal qualityScore;

    @Column(name = "moisture_percent", precision = 6, scale = 3)
    private BigDecimal moisturePercent;

    @Column(name = "uniformity_score", precision = 5, scale = 2)
    private BigDecimal uniformityScore;

    @Column(name = "color_purity_score", precision = 5, scale = 2)
    private BigDecimal colorPurityScore;

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;

    public QualityResult() {
    }

    @PrePersist
    public void onCreate() {
        if (this.calculatedAt == null) {
            this.calculatedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AiAnalysis getAnalysis() {
        return analysis;
    }

    public void setAnalysis(AiAnalysis analysis) {
        this.analysis = analysis;
    }

    public AssignedGrade getAssignedGrade() {
        return assignedGrade;
    }

    public void setAssignedGrade(AssignedGrade assignedGrade) {
        this.assignedGrade = assignedGrade;
    }

    public BigDecimal getQualityScore() {
        return qualityScore;
    }

    public void setQualityScore(BigDecimal qualityScore) {
        this.qualityScore = qualityScore;
    }

    public BigDecimal getMoisturePercent() {
        return moisturePercent;
    }

    public void setMoisturePercent(BigDecimal moisturePercent) {
        this.moisturePercent = moisturePercent;
    }

    public BigDecimal getUniformityScore() {
        return uniformityScore;
    }

    public void setUniformityScore(BigDecimal uniformityScore) {
        this.uniformityScore = uniformityScore;
    }

    public BigDecimal getColorPurityScore() {
        return colorPurityScore;
    }

    public void setColorPurityScore(BigDecimal colorPurityScore) {
        this.colorPurityScore = colorPurityScore;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}
