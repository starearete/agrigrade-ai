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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "farmer_profiles")
public class FarmerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "farmer_code", nullable = false, unique = true, length = 50)
    private String farmerCode;

    @Column(name = "kisan_credit_card_no", length = 50)
    private String kisanCreditCardNo;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "primary_address_id")
    private Address primaryAddress;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "contact_address_id")
    private Address contactAddress;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "farm_address_id")
    private Address farmAddress;

    @Column(name = "farm_same_as_contact", nullable = false)
    private Boolean farmSameAsContact = true;

    @Column(name = "total_land_acres", precision = 8, scale = 2)
    private BigDecimal totalLandAcres;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public FarmerProfile() {
    }

    @PrePersist
    public void onCreate() {
        if (this.farmerCode == null) {
            this.farmerCode = "FARMER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        if (this.farmSameAsContact == null) {
            this.farmSameAsContact = true;
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

    public String getFarmerCode() { return farmerCode; }
    public void setFarmerCode(String farmerCode) { this.farmerCode = farmerCode; }

    public String getKisanCreditCardNo() { return kisanCreditCardNo; }
    public void setKisanCreditCardNo(String kisanCreditCardNo) { this.kisanCreditCardNo = kisanCreditCardNo; }

    public Address getPrimaryAddress() { return primaryAddress; }
    public void setPrimaryAddress(Address primaryAddress) { this.primaryAddress = primaryAddress; }

    public Address getContactAddress() { return contactAddress; }
    public void setContactAddress(Address contactAddress) { this.contactAddress = contactAddress; }

    public Address getFarmAddress() { return farmAddress; }
    public void setFarmAddress(Address farmAddress) { this.farmAddress = farmAddress; }

    public Boolean getFarmSameAsContact() { return farmSameAsContact != null ? farmSameAsContact : true; }
    public void setFarmSameAsContact(Boolean farmSameAsContact) { this.farmSameAsContact = farmSameAsContact; }

    public BigDecimal getTotalLandAcres() { return totalLandAcres; }
    public void setTotalLandAcres(BigDecimal totalLandAcres) { this.totalLandAcres = totalLandAcres; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FarmerProfile that = (FarmerProfile) o;
        return Objects.equals(id, that.id) || Objects.equals(farmerCode, that.farmerCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, farmerCode);
    }
}
