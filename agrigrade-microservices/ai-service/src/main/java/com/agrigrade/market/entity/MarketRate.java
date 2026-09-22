package com.agrigrade.market.entity;

import com.agrigrade.crop.entity.CropVariety;
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
@Table(name = "market_rates")
public class MarketRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "market_id", nullable = false)
    private Market market;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variety_id", nullable = false)
    private CropVariety variety;

    @Column(name = "min_price_per_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal minPricePerKg;

    @Column(name = "max_price_per_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal maxPricePerKg;

    @Column(name = "modal_price_per_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal modalPricePerKg;

    @Column(name = "quantity_arrived_tons", precision = 10, scale = 2)
    private BigDecimal quantityArrivedTons;

    @Column(name = "observed_at", nullable = false)
    private LocalDateTime observedAt;

    public MarketRate() {}

    @PrePersist
    protected void onCreate() {
        if (this.observedAt == null) {
            this.observedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Market getMarket() {
        return market;
    }

    public void setMarket(Market market) {
        this.market = market;
    }

    public CropVariety getVariety() {
        return variety;
    }

    public void setVariety(CropVariety variety) {
        this.variety = variety;
    }

    public BigDecimal getMinPricePerKg() {
        return minPricePerKg;
    }

    public void setMinPricePerKg(BigDecimal minPricePerKg) {
        this.minPricePerKg = minPricePerKg;
    }

    public BigDecimal getMaxPricePerKg() {
        return maxPricePerKg;
    }

    public void setMaxPricePerKg(BigDecimal maxPricePerKg) {
        this.maxPricePerKg = maxPricePerKg;
    }

    public BigDecimal getModalPricePerKg() {
        return modalPricePerKg;
    }

    public void setModalPricePerKg(BigDecimal modalPricePerKg) {
        this.modalPricePerKg = modalPricePerKg;
    }

    public BigDecimal getQuantityArrivedTons() {
        return quantityArrivedTons;
    }

    public void setQuantityArrivedTons(BigDecimal quantityArrivedTons) {
        this.quantityArrivedTons = quantityArrivedTons;
    }

    public LocalDateTime getObservedAt() {
        return observedAt;
    }

    public void setObservedAt(LocalDateTime observedAt) {
        this.observedAt = observedAt;
    }
}
