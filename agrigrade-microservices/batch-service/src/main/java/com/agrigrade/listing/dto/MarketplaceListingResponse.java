package com.agrigrade.listing.dto;

import java.math.BigDecimal;
import java.util.List;

public record MarketplaceListingResponse(
        Long id,
        Long batchId,
        String listingCode,
        Long farmerId,
        String farmerName,
        String farmerCode,
        String farmerDistrict,
        boolean farmerVerified,
        String cropName,
        String varietyName,
        BigDecimal askingPricePerUnit,
        BigDecimal minimumOrderQuantity,
        BigDecimal quantityRemaining,
        String quantityUnit,
        String assignedGrade,
        Double qualityScore,
        String harvestDate,
        Integer cropAgeDays,
        String inspectionDate,
        Double estimatedRemainingDays,
        Double effectiveShelfLifeDays,
        Double remainingShelfLifeDays,
        String shelfLifeStatus,
        String certificateNumber,
        String coverImageUrl,
        List<String> images,
        String listedAt,
        String expiresAt,
        String status,
        Double distanceKm
) {}
