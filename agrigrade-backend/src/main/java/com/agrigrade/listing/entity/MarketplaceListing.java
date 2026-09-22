package com.agrigrade.listing.entity;

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
@Table(name = "marketplace_listings")
public class MarketplaceListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private ProductBatch batch;

    @Column(name = "listing_code", nullable = false, length = 60, unique = true)
    private String listingCode;

    @Column(name = "asking_price_per_unit", nullable = false, precision = 12, scale = 2)
    private BigDecimal askingPricePerUnit;

    @Column(name = "minimum_order_quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal minimumOrderQuantity;

    @Column(name = "quantity_remaining", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityRemaining;

    @Column(name = "listed_at", nullable = false, updatable = false)
    private LocalDateTime listedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "certification_locked", nullable = false)
    private Boolean certificationLocked = false;

    @Column(name = "certification_locked_at")
    private LocalDateTime certificationLockedAt;

    public MarketplaceListing() {
    }

    public MarketplaceListing(
            ProductBatch batch,
            String listingCode,
            BigDecimal askingPricePerUnit,
            BigDecimal minimumOrderQuantity,
            BigDecimal quantityRemaining,
            LocalDateTime expiresAt,
            String status
    ) {
        this.batch = batch;
        this.listingCode = listingCode;
        this.askingPricePerUnit = askingPricePerUnit;
        this.minimumOrderQuantity = minimumOrderQuantity;
        this.quantityRemaining = quantityRemaining;
        this.expiresAt = expiresAt;
        this.status = status != null ? status : "ACTIVE";
        this.certificationLocked = true;
        this.certificationLockedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.listedAt == null) {
            this.listedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "ACTIVE";
        }
        if (this.certificationLocked == null) {
            this.certificationLocked = false;
        }
    }

    public Boolean getCertificationLocked() {
        return certificationLocked != null ? certificationLocked : false;
    }

    public Boolean isCertificationLocked() {
        return Boolean.TRUE.equals(this.certificationLocked);
    }

    public void setCertificationLocked(Boolean certificationLocked) {
        this.certificationLocked = certificationLocked;
    }

    public LocalDateTime getCertificationLockedAt() {
        return certificationLockedAt;
    }

    public void setCertificationLockedAt(LocalDateTime certificationLockedAt) {
        this.certificationLockedAt = certificationLockedAt;
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

    public String getListingCode() {
        return listingCode;
    }

    public void setListingCode(String listingCode) {
        this.listingCode = listingCode;
    }

    public BigDecimal getAskingPricePerUnit() {
        return askingPricePerUnit;
    }

    public void setAskingPricePerUnit(BigDecimal askingPricePerUnit) {
        this.askingPricePerUnit = askingPricePerUnit;
    }

    public BigDecimal getMinimumOrderQuantity() {
        return minimumOrderQuantity;
    }

    public void setMinimumOrderQuantity(BigDecimal minimumOrderQuantity) {
        this.minimumOrderQuantity = minimumOrderQuantity;
    }

    public BigDecimal getQuantityRemaining() {
        return quantityRemaining;
    }

    public void setQuantityRemaining(BigDecimal quantityRemaining) {
        this.quantityRemaining = quantityRemaining;
    }

    public LocalDateTime getListedAt() {
        return listedAt;
    }

    public void setListedAt(LocalDateTime listedAt) {
        this.listedAt = listedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
