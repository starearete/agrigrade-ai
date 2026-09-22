package com.agrigrade.trade.entity;

import com.agrigrade.listing.entity.MarketplaceListing;
import com.agrigrade.profile.entity.BuyerProfile;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "buyer_inquiries")
public class BuyerInquiry {

    public enum Status {
        PENDING, ACCEPTED, REJECTED, NEGOTIATING, CANCELLED, EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private MarketplaceListing listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private BuyerProfile buyer;

    @Column(name = "offered_price_per_unit", nullable = false, precision = 12, scale = 2)
    private BigDecimal offeredPricePerUnit;

    @Column(name = "requested_quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal requestedQuantity;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public BuyerInquiry() {}

    public BuyerInquiry(MarketplaceListing listing, BuyerProfile buyer, BigDecimal offeredPricePerUnit, BigDecimal requestedQuantity, String message) {
        this.listing = listing;
        this.buyer = buyer;
        this.offeredPricePerUnit = offeredPricePerUnit;
        this.requestedQuantity = requestedQuantity;
        this.message = message;
        this.status = Status.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MarketplaceListing getListing() {
        return listing;
    }

    public void setListing(MarketplaceListing listing) {
        this.listing = listing;
    }

    public BuyerProfile getBuyer() {
        return buyer;
    }

    public void setBuyer(BuyerProfile buyer) {
        this.buyer = buyer;
    }

    public BigDecimal getOfferedPricePerUnit() {
        return offeredPricePerUnit;
    }

    public void setOfferedPricePerUnit(BigDecimal offeredPricePerUnit) {
        this.offeredPricePerUnit = offeredPricePerUnit;
    }

    public BigDecimal getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(BigDecimal requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
