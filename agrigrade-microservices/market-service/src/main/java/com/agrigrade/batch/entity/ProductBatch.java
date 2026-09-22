package com.agrigrade.batch.entity;

import com.agrigrade.crop.entity.CropVariety;
import com.agrigrade.profile.entity.Address;
import com.agrigrade.profile.entity.FarmerProfile;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_batches")
public class ProductBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_number", nullable = false, unique = true, length = 50)
    private String batchNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private FarmerProfile farmer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variety_id", nullable = false)
    private CropVariety variety;

    @Column(name = "harvest_date", nullable = false)
    private LocalDate harvestDate;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "quantity_unit", nullable = false, length = 20)
    private String quantityUnit = "KG";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "harvest_location_id", nullable = false)
    private Address harvestLocation;

    @Column(name = "storage_condition", nullable = false, length = 30)
    private String storageCondition = "AMBIENT";

    @Column(nullable = false, length = 30)
    private String status = "HARVESTED";

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BatchImage> images = new ArrayList<>();

    @Column(name = "inspection_locked", nullable = false)
    private Boolean inspectionLocked = false;

    @Column(name = "inspection_locked_at")
    private LocalDateTime inspectionLockedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public ProductBatch() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.inspectionLocked == null) {
            this.inspectionLocked = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
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

    public LocalDateTime getInspectionLockedAt() {
        return inspectionLockedAt;
    }

    public void setInspectionLockedAt(LocalDateTime inspectionLockedAt) {
        this.inspectionLockedAt = inspectionLockedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public FarmerProfile getFarmer() {
        return farmer;
    }

    public void setFarmer(FarmerProfile farmer) {
        this.farmer = farmer;
    }

    public CropVariety getVariety() {
        return variety;
    }

    public void setVariety(CropVariety variety) {
        this.variety = variety;
    }

    public LocalDate getHarvestDate() {
        return harvestDate;
    }

    public void setHarvestDate(LocalDate harvestDate) {
        this.harvestDate = harvestDate;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getQuantityUnit() {
        return quantityUnit;
    }

    public void setQuantityUnit(String quantityUnit) {
        this.quantityUnit = quantityUnit;
    }

    public Address getHarvestLocation() {
        return harvestLocation;
    }

    public void setHarvestLocation(Address harvestLocation) {
        this.harvestLocation = harvestLocation;
    }

    public String getStorageCondition() {
        return storageCondition;
    }

    public void setStorageCondition(String storageCondition) {
        this.storageCondition = storageCondition;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<BatchImage> getImages() {
        return images;
    }

    public void setImages(List<BatchImage> images) {
        this.images = images;
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
