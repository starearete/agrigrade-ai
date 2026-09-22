package com.agrigrade.profile.dto;

public record AddressDto(
    Long id,
    String addressType,
    String addressLine1,
    String addressLine2,
    String villageTownCity,
    String taluk,
    String locality,
    String district,
    String state,
    Long stateId,
    Long districtId,
    String pincode,
    String landmark
) {}
