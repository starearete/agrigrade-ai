package com.agrigrade.ai.service;

import com.agrigrade.ai.dto.CropClassificationResult;
import com.agrigrade.batch.entity.BatchImage;

public interface CropClassificationService {
    CropClassificationResult classifyCrop(BatchImage image, String expectedCrop, boolean simulateCropMismatch);
}
