package com.agrigrade.location.controller;

import com.agrigrade.location.dto.LocationDto.CountryDto;
import com.agrigrade.location.dto.LocationDto.DistrictDto;
import com.agrigrade.location.dto.LocationDto.StateDto;
import com.agrigrade.location.dto.TalukDto;
import com.agrigrade.location.entity.Country;
import com.agrigrade.location.entity.District;
import com.agrigrade.location.entity.State;
import com.agrigrade.location.repository.CountryRepository;
import com.agrigrade.location.repository.DistrictRepository;
import com.agrigrade.location.repository.StateRepository;
import com.agrigrade.location.repository.TalukRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/locations")
public class LocationController {

    private final CountryRepository countryRepository;
    private final StateRepository stateRepository;
    private final DistrictRepository districtRepository;
    private final TalukRepository talukRepository;

    public LocationController(
        CountryRepository countryRepository,
        StateRepository stateRepository,
        DistrictRepository districtRepository,
        TalukRepository talukRepository
    ) {
        this.countryRepository = countryRepository;
        this.stateRepository = stateRepository;
        this.districtRepository = districtRepository;
        this.talukRepository = talukRepository;
    }

    @GetMapping("/countries")
    public ResponseEntity<List<CountryDto>> getCountries() {
        List<CountryDto> list = countryRepository.findAll().stream()
            .map(c -> new CountryDto(c.getId(), c.getName(), c.getCode()))
            .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/states")
    public ResponseEntity<List<StateDto>> getStates(
        @RequestParam(value = "country", required = false, defaultValue = "IN") String countryCode,
        @RequestParam(value = "countryId", required = false) Long countryId
    ) {
        Long targetCountryId = countryId;
        if (targetCountryId == null) {
            Country country = countryRepository.findByCodeIgnoreCase(countryCode)
                .orElseGet(() -> countryRepository.findByNameIgnoreCase("India").orElse(null));
            targetCountryId = country != null ? country.getId() : 1L;
        }

        List<StateDto> list = stateRepository.findByCountryIdOrderByNameAsc(targetCountryId).stream()
            .map(s -> new StateDto(s.getId(), s.getCountryId(), s.getName(), s.getCode(), s.getType()))
            .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/districts")
    public ResponseEntity<List<DistrictDto>> getDistricts(
        @RequestParam("stateId") Long stateId
    ) {
        List<DistrictDto> list = districtRepository.findByStateIdOrderByNameAsc(stateId).stream()
            .map(d -> new DistrictDto(d.getId(), d.getStateId(), d.getName(), d.getCode()))
            .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/taluks")
    public ResponseEntity<List<TalukDto>> getTaluks(
        @RequestParam("districtId") Long districtId
    ) {
        List<TalukDto> list = talukRepository.findByDistrictIdOrderByNameAsc(districtId).stream()
            .map(t -> new TalukDto(t.getId(), t.getDistrictId(), t.getName(), t.getCode()))
            .toList();
        return ResponseEntity.ok(list);
    }
}
