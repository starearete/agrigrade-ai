package com.agrigrade.prediction.entity;

import com.agrigrade.batch.entity.ProductBatch;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "price_predictions")
public class PricePrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private ProductBatch batch;

    @Column(name = "predicted_price_per_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal predictedPricePerKg;

    @Column(name = "price_range_low", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceRangeLow;

    @Column(name = "price_range_high", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceRangeHigh;

    @Column(name = "calculated_at", nullable = false, updatable = false)
    private LocalDateTime calculatedAt;

    public PricePrediction() {}

    @PrePersist
    protected void onCreate() {
        this.calculatedAt = LocalDateTime.now();
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

    public BigDecimal getPredictedPricePerKg() {
        return predictedPricePerKg;
    }

    public void setPredictedPricePerKg(BigDecimal predictedPricePerKg) {
        this.predictedPricePerKg = predictedPricePerKg;
    }

    public BigDecimal getPriceRangeLow() {
        return priceRangeLow;
    }

    public void setPriceRangeLow(BigDecimal priceRangeLow) {
        this.priceRangeLow = priceRangeLow;
    }

    public BigDecimal getPriceRangeHigh() {
        return priceRangeHigh;
    }

    public void setPriceRangeHigh(BigDecimal priceRangeHigh) {
        this.priceRangeHigh = priceRangeHigh;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}
