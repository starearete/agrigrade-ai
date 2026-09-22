package com.agrigrade.trade.dto;

import java.util.List;

public record NearbyBuyerDto(
    Long buyerId,
    String publicId,
    String businessName,
    String fullName,
    boolean verified,
    String district,
    String taluk,
    String villageTownCity,
    Double distanceKm,
    String procurementCapacity,
    String buyerType,
    List<String> interestedCrops
) {}
