package com.agrigrade.crop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "crops")
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private CropCategory category;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "scientific_name", length = 180)
    private String scientificName;

    @Column(name = "base_shelf_life_days", nullable = false)
    private Integer baseShelfLifeDays = 14;

    @Column(name = "default_storage_condition", length = 100)
    private String defaultStorageCondition = "Cool storage";

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Crop() {}

    public Crop(Long id, CropCategory category, String code, String name, String scientificName, Integer baseShelfLifeDays, String defaultStorageCondition, Boolean isActive) {
        this.id = id;
        this.category = category;
        this.code = code;
        this.name = name;
        this.scientificName = scientificName;
        this.baseShelfLifeDays = baseShelfLifeDays != null ? baseShelfLifeDays : 14;
        this.defaultStorageCondition = defaultStorageCondition != null ? defaultStorageCondition : "Cool storage";
        this.isActive = isActive;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CropCategory getCategory() {
        return category;
    }

    public void setCategory(CropCategory category) {
        this.category = category;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getScientificName() {
        return scientificName;
    }

    public void setScientificName(String scientificName) {
        this.scientificName = scientificName;
    }

    public Integer getBaseShelfLifeDays() {
        return baseShelfLifeDays;
    }

    public void setBaseShelfLifeDays(Integer baseShelfLifeDays) {
        this.baseShelfLifeDays = baseShelfLifeDays;
    }

    public String getDefaultStorageCondition() {
        return defaultStorageCondition;
    }

    public void setDefaultStorageCondition(String defaultStorageCondition) {
        this.defaultStorageCondition = defaultStorageCondition;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
