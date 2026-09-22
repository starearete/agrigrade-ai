package com.agrigrade.crop.service;

import com.agrigrade.common.exception.ApiException;
import com.agrigrade.crop.dto.CreateVarietyRequest;
import com.agrigrade.crop.dto.CropCategoryDto;
import com.agrigrade.crop.dto.CropDto;
import com.agrigrade.crop.dto.CropVarietyDto;
import com.agrigrade.crop.dto.UpdateCropRequest;
import com.agrigrade.crop.entity.Crop;
import com.agrigrade.crop.entity.CropCategory;
import com.agrigrade.crop.entity.CropVariety;
import com.agrigrade.crop.repository.CropCategoryRepository;
import com.agrigrade.crop.repository.CropRepository;
import com.agrigrade.crop.repository.CropVarietyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CropService {

    private final CropCategoryRepository categoryRepository;
    private final CropRepository cropRepository;
    private final CropVarietyRepository varietyRepository;

    public CropService(
            CropCategoryRepository categoryRepository,
            CropRepository cropRepository,
            CropVarietyRepository varietyRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.cropRepository = cropRepository;
        this.varietyRepository = varietyRepository;
    }

    public List<CropCategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(c -> new CropCategoryDto(c.getId(), c.getCode(), c.getName(), c.getDescription()))
                .toList();
    }

    public List<CropDto> getAllActiveCrops() {
        return cropRepository.findByIsActiveTrue().stream()
                .map(this::mapToCropDto)
                .toList();
    }

    public CropDto getCropById(Long id) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CROP_NOT_FOUND", "Crop not found with id: " + id));
        return mapToCropDto(crop);
    }

    public List<CropVarietyDto> getVarietiesByCropId(Long cropId) {
        return varietyRepository.findByCropIdAndIsActiveTrue(cropId).stream()
                .map(this::mapToVarietyDto)
                .toList();
    }

    @Transactional
    public CropDto updateCrop(Long id, UpdateCropRequest request) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CROP_NOT_FOUND", "Crop not found with id: " + id));

        if (request.name() != null && !request.name().isBlank()) {
            crop.setName(request.name().trim());
        }
        if (request.scientificName() != null) {
            crop.setScientificName(request.scientificName().trim());
        }
        if (request.baseShelfLifeDays() != null && request.baseShelfLifeDays() > 0) {
            crop.setBaseShelfLifeDays(request.baseShelfLifeDays());
        }
        if (request.defaultStorageCondition() != null && !request.defaultStorageCondition().isBlank()) {
            crop.setDefaultStorageCondition(request.defaultStorageCondition().trim());
        }
        if (request.isActive() != null) {
            crop.setIsActive(request.isActive());
        }

        Crop saved = cropRepository.save(crop);
        return mapToCropDto(saved);
    }

    @Transactional
    public CropVarietyDto addVariety(Long cropId, CreateVarietyRequest request) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CROP_NOT_FOUND", "Crop not found with id: " + cropId));

        if (request.name() == null || request.name().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_VARIETY_NAME", "Variety name is required");
        }

        String code = request.code();
        if (code == null || code.isBlank()) {
            code = crop.getCode() + "_" + request.name().toUpperCase().replaceAll("[^A-Z0-9]", "_");
        }

        CropVariety variety = new CropVariety();
        variety.setCrop(crop);
        variety.setCode(code);
        variety.setName(request.name().trim());
        variety.setScientificName(request.scientificName() != null ? request.scientificName().trim() : crop.getScientificName());
        variety.setIsActive(request.isActive() != null ? request.isActive() : true);

        CropVariety saved = varietyRepository.save(variety);
        return mapToVarietyDto(saved);
    }

    private CropDto mapToCropDto(Crop crop) {
        return new CropDto(
                crop.getId(),
                crop.getCategory() != null ? crop.getCategory().getId() : null,
                crop.getCategory() != null ? crop.getCategory().getName() : null,
                crop.getCode(),
                crop.getName(),
                crop.getScientificName(),
                crop.getBaseShelfLifeDays() != null ? crop.getBaseShelfLifeDays() : 14,
                crop.getDefaultStorageCondition() != null ? crop.getDefaultStorageCondition() : "Cool storage",
                crop.getIsActive()
        );
    }

    private CropVarietyDto mapToVarietyDto(CropVariety cv) {
        return new CropVarietyDto(
                cv.getId(),
                cv.getCrop() != null ? cv.getCrop().getId() : null,
                cv.getCrop() != null ? cv.getCrop().getName() : null,
                cv.getCode(),
                cv.getName(),
                cv.getScientificName(),
                cv.getIsActive()
        );
    }
}
