package com.agrigrade.trade.entity;

import com.agrigrade.listing.entity.MarketplaceListing;
import com.agrigrade.profile.entity.BuyerProfile;
import com.agrigrade.profile.entity.FarmerProfile;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class TradeOrder {

    public enum Status {
        AGREED, IN_TRANSIT, DELIVERED, COMPLETED, CANCELLED, DISPUTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, length = 60)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private MarketplaceListing listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private BuyerProfile buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farmer_id", nullable = false)
    private FarmerProfile farmer;

    @Column(name = "agreed_price_per_unit", nullable = false, precision = 12, scale = 2)
    private BigDecimal agreedPricePerUnit;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.AGREED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public TradeOrder() {}

    public TradeOrder(String orderNumber, MarketplaceListing listing, BuyerProfile buyer, FarmerProfile farmer, BigDecimal agreedPricePerUnit, BigDecimal quantity, BigDecimal totalAmount) {
        this.orderNumber = orderNumber;
        this.listing = listing;
        this.buyer = buyer;
        this.farmer = farmer;
        this.agreedPricePerUnit = agreedPricePerUnit;
        this.quantity = quantity;
        this.totalAmount = totalAmount;
        this.status = Status.AGREED;
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

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
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

    public FarmerProfile getFarmer() {
        return farmer;
    }

    public void setFarmer(FarmerProfile farmer) {
        this.farmer = farmer;
    }

    public BigDecimal getAgreedPricePerUnit() {
        return agreedPricePerUnit;
    }

    public void setAgreedPricePerUnit(BigDecimal agreedPricePerUnit) {
        this.agreedPricePerUnit = agreedPricePerUnit;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
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
