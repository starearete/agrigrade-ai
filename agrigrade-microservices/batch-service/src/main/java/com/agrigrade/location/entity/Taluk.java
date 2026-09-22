package com.agrigrade.location.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "taluks")
public class Taluk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "district_id", nullable = false)
    private Long districtId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 30)
    private String code;

    public Taluk() {}

    public Taluk(Long districtId, String name, String code) {
        this.districtId = districtId;
        this.name = name;
        this.code = code;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDistrictId() { return districtId; }
    public void setDistrictId(Long districtId) { this.districtId = districtId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
