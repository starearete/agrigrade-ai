package com.agrigrade.admin.dto;

public record AdminDashboardStatsDto(
        long totalUsers,
        long totalFarmers,
        long totalBuyers,
        long activeFarmers,
        long activeBuyers,
        long suspendedUsers,
        long verifiedFarmers,
        long verifiedBuyers,
        long activeListings,
        long suspendedListings,
        long pendingPurchaseRequests,
        long completedTrades,
        long totalCrops,
        long totalDiseases,
        long totalMarkets,
        double totalListedQuantity,
        double totalTradedQuantity
) {}
