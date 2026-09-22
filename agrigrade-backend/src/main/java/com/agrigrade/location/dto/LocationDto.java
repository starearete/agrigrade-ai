package com.agrigrade.location.dto;

public class LocationDto {

    public record CountryDto(
        Long id,
        String name,
        String code
    ) {}

    public record StateDto(
        Long id,
        Long countryId,
        String name,
        String code,
        String type
    ) {}

    public record DistrictDto(
        Long id,
        Long stateId,
        String name,
        String code
    ) {}
}
