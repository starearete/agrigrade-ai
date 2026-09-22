package com.agrigrade.admin.dto;

public record UserAdminDto(
        Long id,
        String publicId,
        String fullName,
        String email,
        String mobileNumber,
        String role,
        String district,
        String taluk,
        String village,
        String address,
        String status,
        String verificationStatus,
        Double acreage,
        Double buyingCapacity,
        String primaryCrop,
        String preferredCrops,
        String businessName,
        String farmerCode,
        String buyerCode,
        String createdAt,
        String lastActive
) {}
