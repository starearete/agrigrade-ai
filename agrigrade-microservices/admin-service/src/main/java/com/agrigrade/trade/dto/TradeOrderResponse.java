package com.agrigrade.trade.dto;

import java.math.BigDecimal;

public record TradeOrderResponse(
        Long id,
        String orderNumber,
        Long listingId,
        String listingCode,
        Long buyerId,
        String buyerName,
        String buyerBusinessName,
        Long farmerId,
        String farmerName,
        String cropName,
        String varietyName,
        BigDecimal agreedPricePerUnit,
        BigDecimal quantity,
        String quantityUnit,
        BigDecimal totalAmount,
        String status,
        String createdAt,
        String updatedAt
) {}
