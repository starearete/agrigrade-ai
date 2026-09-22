package com.agrigrade.listing.dto;

import java.math.BigDecimal;

public record OrderResponse(
    Long orderId,
    String orderNumber,
    Long listingId,
    String listingCode,
    Long buyerId,
    String buyerName,
    Long farmerId,
    String farmerName,
    String cropName,
    String varietyName,
    BigDecimal agreedPricePerUnit,
    BigDecimal quantity,
    String quantityUnit,
    BigDecimal totalAmount,
    String status,
    BigDecimal remainingQuantityOnListing,
    String listingStatus,
    String createdAt
) {}
