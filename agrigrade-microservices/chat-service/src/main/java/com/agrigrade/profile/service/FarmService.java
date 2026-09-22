package com.agrigrade.profile.service;

import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.common.exception.ApiException;
import com.agrigrade.profile.dto.AddressRequest;
import com.agrigrade.profile.dto.AddressResponse;
import com.agrigrade.profile.dto.FarmRequest;
import com.agrigrade.profile.dto.FarmResponse;
import com.agrigrade.profile.entity.Address;
import com.agrigrade.profile.entity.Farm;
import com.agrigrade.profile.entity.FarmerProfile;
import com.agrigrade.profile.repository.AddressRepository;
import com.agrigrade.profile.repository.FarmerProfileRepository;
import com.agrigrade.profile.repository.FarmRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class FarmService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final FarmerProfileService farmerProfileService;
    private final FarmRepository farmRepository;
    private final AddressRepository addressRepository;

    public FarmService(
        UserRepository userRepository,
        FarmerProfileRepository farmerProfileRepository,
        FarmerProfileService farmerProfileService,
        FarmRepository farmRepository,
        AddressRepository addressRepository
    ) {
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.farmerProfileService = farmerProfileService;
        this.farmRepository = farmRepository;
        this.addressRepository = addressRepository;
    }

    @Transactional
    public FarmResponse createFarm(String publicId, FarmRequest request) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User profile not found."));

        FarmerProfile farmerProfile = farmerProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> farmerProfileService.createInitialFarmerProfile(user));

        Address address = new Address();
        address.setUserId(user.getId());
        address.setAddressType("FARM");
        address.setIsPrimary(false);
        if (request.address() != null) {
            updateAddressFromRequest(address, request.address());
        } else {
            address.setAddressLine1(request.farmName() + " Location");
            address.setDistrict("Unknown");
            address.setPincode("600001");
        }
        Address savedAddress = addressRepository.save(address);

        Farm farm = new Farm();
        farm.setFarmer(farmerProfile);
        farm.setFarmName(request.farmName());
        farm.setAreaAcres(request.areaAcres());
        farm.setSoilType(request.soilType());
        farm.setIrrigationType(request.irrigationType());
        farm.setIsActive(request.isActive() != null ? request.isActive() : true);
        farm.setAddress(savedAddress);

        Farm savedFarm = farmRepository.save(farm);
        return mapToFarmResponse(savedFarm);
    }

    @Transactional(readOnly = true)
    public List<FarmResponse> getFarms(String publicId) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User profile not found."));

        FarmerProfile farmerProfile = farmerProfileRepository.findByUserId(user.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARMER_PROFILE_NOT_FOUND", "Farmer profile not found."));

        return farmRepository.findByFarmerId(farmerProfile.getId()).stream()
            .map(this::mapToFarmResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public FarmResponse getFarmById(String publicId, Long farmId) {
        FarmerProfile farmerProfile = getFarmerProfileByPublicId(publicId);

        Farm farm = farmRepository.findByIdAndFarmerId(farmId, farmerProfile.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARM_NOT_FOUND", "Farm not found or access denied."));

        return mapToFarmResponse(farm);
    }

    @Transactional
    public FarmResponse updateFarm(String publicId, Long farmId, FarmRequest request) {
        FarmerProfile farmerProfile = getFarmerProfileByPublicId(publicId);

        Farm farm = farmRepository.findByIdAndFarmerId(farmId, farmerProfile.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARM_NOT_FOUND", "Farm not found or access denied."));

        if (StringUtils.hasText(request.farmName())) {
            farm.setFarmName(request.farmName());
        }
        if (request.areaAcres() != null) {
            farm.setAreaAcres(request.areaAcres());
        }
        if (request.soilType() != null) {
            farm.setSoilType(request.soilType());
        }
        if (request.irrigationType() != null) {
            farm.setIrrigationType(request.irrigationType());
        }
        if (request.isActive() != null) {
            farm.setIsActive(request.isActive());
        }

        if (request.address() != null && farm.getAddress() != null) {
            updateAddressFromRequest(farm.getAddress(), request.address());
            addressRepository.save(farm.getAddress());
        }

        Farm updatedFarm = farmRepository.save(farm);
        return mapToFarmResponse(updatedFarm);
    }

    @Transactional
    public void deleteFarm(String publicId, Long farmId) {
        FarmerProfile farmerProfile = getFarmerProfileByPublicId(publicId);

        Farm farm = farmRepository.findByIdAndFarmerId(farmId, farmerProfile.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARM_NOT_FOUND", "Farm not found or access denied."));

        farmRepository.delete(farm);
    }

    private FarmerProfile getFarmerProfileByPublicId(String publicId) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User profile not found."));

        return farmerProfileRepository.findByUserId(user.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARMER_PROFILE_NOT_FOUND", "Farmer profile not found."));
    }

    public FarmResponse mapToFarmResponse(Farm farm) {
        AddressResponse addressResp = farm.getAddress() != null
            ? mapToAddressResponse(farm.getAddress())
            : null;

        String createdAtStr = farm.getCreatedAt() != null
            ? farm.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME)
            : "";

        return new FarmResponse(
            farm.getId(),
            farm.getFarmer().getId(),
            farm.getFarmName(),
            farm.getAreaAcres(),
            farm.getSoilType(),
            farm.getIrrigationType(),
            farm.getIsActive(),
            addressResp,
            createdAtStr
        );
    }

    public AddressResponse mapToAddressResponse(Address address) {
        return new AddressResponse(
            address.getId(),
            address.getUserId(),
            address.getAddressType(),
            address.getAddressLine1(),
            address.getAddressLine2(),
            address.getLocality(),
            address.getDistrict(),
            address.getState(),
            address.getPincode(),
            address.getLatitude(),
            address.getLongitude(),
            address.getIsPrimary()
        );
    }

    public void updateAddressFromRequest(Address address, AddressRequest req) {
        address.setAddressLine1(req.addressLine1());
        address.setAddressLine2(req.addressLine2());
        address.setLocality(req.locality());
        address.setDistrict(req.district());
        if (StringUtils.hasText(req.state())) {
            address.setState(req.state());
        }
        address.setPincode(req.pincode());
        address.setLatitude(req.latitude());
        address.setLongitude(req.longitude());
        if (StringUtils.hasText(req.addressType())) {
            address.setAddressType(req.addressType());
        }
        if (req.isPrimary() != null) {
            address.setIsPrimary(req.isPrimary());
        }
    }
}
