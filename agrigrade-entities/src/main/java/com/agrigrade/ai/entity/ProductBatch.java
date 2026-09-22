package com.agrigrade.ai.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "product_batches")
public class ProductBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_number", nullable = false, unique = true, length = 50)
    private String batchNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farmer_id", nullable = false)
    private FarmerProfile farmer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variety_id", nullable = false)
    private CropVariety variety;

    @Column(name = "harvest_date", nullable = false)
    private LocalDate harvestDate;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "quantity_unit", nullable = false, length = 20)
    private String quantityUnit = "KG";

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "harvest_location_id", nullable = false)
    private Address harvestLocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "storage_condition", nullable = false)
    private StorageCondition storageCondition = StorageCondition.AMBIENT;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BatchStatus status = BatchStatus.HARVESTED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum StorageCondition {
        AMBIENT, COLD_STORAGE, REFRIGERATED, CONTROLLED_ATMOSPHERE
    }

    public enum BatchStatus {
        HARVESTED, ANALYZED, LISTED, PARTIALLY_SOLD, SOLD, EXPIRED, DELISTED
    }

    public ProductBatch() {}

    public ProductBatch(String batchNumber, FarmerProfile farmer, CropVariety variety, LocalDate harvestDate, BigDecimal quantity, Address harvestLocation) {
        this.batchNumber = batchNumber;
        this.farmer = farmer;
        this.variety = variety;
        this.harvestDate = harvestDate;
        this.quantity = quantity;
        this.harvestLocation = harvestLocation;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters

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

    public StorageCondition getStorageCondition() {
        return storageCondition;
    }

    public void setStorageCondition(StorageCondition storageCondition) {
        this.storageCondition = storageCondition;
    }

    public BatchStatus getStatus() {
        return status;
    }

    public void setStatus(BatchStatus status) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProductBatch batch = (ProductBatch) o;
        return Objects.equals(id, batch.id) || Objects.equals(batchNumber, batch.batchNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, batchNumber);
    }

    @Override
    public String toString() {
        return "ProductBatch{" +
                "id=" + id +
                ", batchNumber='" + batchNumber + '\'' +
                ", harvestDate=" + harvestDate +
                ", quantity=" + quantity +
                ", status=" + status +
                '}';
    }
}
