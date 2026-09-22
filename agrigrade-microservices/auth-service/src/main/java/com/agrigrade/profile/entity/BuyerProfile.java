package com.agrigrade.profile.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "buyer_profiles")
public class BuyerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "buyer_code", nullable = false, unique = true, length = 50)
    private String buyerCode;

    @Column(name = "business_name", nullable = false, length = 200)
    private String businessName;

    @Column(name = "gst_number", length = 15)
    private String gstNumber;

    @Column(name = "business_registration_number", length = 100)
    private String businessRegistrationNumber;

    @Column(name = "buyer_type", nullable = false, length = 50)
    private String buyerType = "WHOLESALER";

    @Column(name = "purchase_capacity", length = 100)
    private String purchaseCapacity;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "primary_address_id")
    private Address primaryAddress;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "business_address_id")
    private Address businessAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public BuyerProfile() {
    }

    @PrePersist
    public void onCreate() {
        if (this.buyerCode == null) {
            this.buyerCode = "BUYER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        if (this.buyerType == null) {
            this.buyerType = "WHOLESALER";
        }
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getBuyerCode() { return buyerCode; }
    public void setBuyerCode(String buyerCode) { this.buyerCode = buyerCode; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }

    public String getBusinessRegistrationNumber() { return businessRegistrationNumber; }
    public void setBusinessRegistrationNumber(String businessRegistrationNumber) { this.businessRegistrationNumber = businessRegistrationNumber; }

    public String getBuyerType() { return buyerType; }
    public void setBuyerType(String buyerType) { this.buyerType = buyerType; }

    public String getPurchaseCapacity() { return purchaseCapacity; }
    public void setPurchaseCapacity(String purchaseCapacity) { this.purchaseCapacity = purchaseCapacity; }

    public Address getPrimaryAddress() { return primaryAddress; }
    public void setPrimaryAddress(Address primaryAddress) { this.primaryAddress = primaryAddress; }

    public Address getBusinessAddress() { return businessAddress; }
    public void setBusinessAddress(Address businessAddress) { this.businessAddress = businessAddress; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BuyerProfile that = (BuyerProfile) o;
        return Objects.equals(id, that.id) || Objects.equals(buyerCode, that.buyerCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, buyerCode);
    }
}
