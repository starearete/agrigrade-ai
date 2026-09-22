package com.agrigrade.crop.controller;

import com.agrigrade.crop.dto.CreateVarietyRequest;
import com.agrigrade.crop.dto.CropCategoryDto;
import com.agrigrade.crop.dto.CropDto;
import com.agrigrade.crop.dto.CropVarietyDto;
import com.agrigrade.crop.dto.UpdateCropRequest;
import com.agrigrade.crop.service.CropService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/crops")
public class CropController {

    private final CropService cropService;

    public CropController(CropService cropService) {
        this.cropService = cropService;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CropCategoryDto>> getCategories() {
        return ResponseEntity.ok(cropService.getAllCategories());
    }

    @GetMapping
    public ResponseEntity<List<CropDto>> getCrops() {
        return ResponseEntity.ok(cropService.getAllActiveCrops());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CropDto> getCropById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(cropService.getCropById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CropDto> updateCrop(
            @PathVariable("id") Long id,
            @RequestBody UpdateCropRequest request
    ) {
        return ResponseEntity.ok(cropService.updateCrop(id, request));
    }

    @GetMapping("/{id}/varieties")
    public ResponseEntity<List<CropVarietyDto>> getVarietiesByCropId(@PathVariable("id") Long id) {
        return ResponseEntity.ok(cropService.getVarietiesByCropId(id));
    }

    @PostMapping("/{id}/varieties")
    public ResponseEntity<CropVarietyDto> addVariety(
            @PathVariable("id") Long id,
            @RequestBody CreateVarietyRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cropService.addVariety(id, request));
    }
}
