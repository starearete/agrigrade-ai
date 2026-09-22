package com.agrigrade.profile.service;

import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.common.exception.ApiException;
import com.agrigrade.profile.dto.AddressRequest;
import com.agrigrade.profile.dto.AddressResponse;
import com.agrigrade.profile.dto.FarmerProfileResponse;
import com.agrigrade.profile.dto.FarmerProfileUpdateRequest;
import com.agrigrade.profile.entity.Address;
import com.agrigrade.profile.entity.FarmerProfile;
import com.agrigrade.profile.repository.AddressRepository;
import com.agrigrade.profile.repository.FarmerProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class FarmerProfileService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final AddressRepository addressRepository;

    public FarmerProfileService(
        UserRepository userRepository,
        FarmerProfileRepository farmerProfileRepository,
        AddressRepository addressRepository
    ) {
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.addressRepository = addressRepository;
    }

    @Transactional
    public FarmerProfileResponse getFarmerProfile(String publicId) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User profile not found."));

        FarmerProfile profile = farmerProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> createInitialFarmerProfile(user));

        return mapToFarmerProfileResponse(user, profile);
    }

    @Transactional
    public FarmerProfileResponse updateFarmerProfile(String publicId, FarmerProfileUpdateRequest request) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User profile not found."));

        FarmerProfile profile = farmerProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> createInitialFarmerProfile(user));

        if (StringUtils.hasText(request.fullName())) {
            user.setFullName(request.fullName());
        }
        if (StringUtils.hasText(request.mobileNumber())) {
            user.setMobileNumber(request.mobileNumber());
        }
        userRepository.save(user);

        if (request.kisanCreditCardNo() != null) {
            profile.setKisanCreditCardNo(request.kisanCreditCardNo());
        }
        if (request.totalLandAcres() != null) {
            profile.setTotalLandAcres(request.totalLandAcres());
        }

        if (request.primaryAddress() != null) {
            Address address = profile.getPrimaryAddress();
            if (address == null) {
                address = new Address();
                address.setUserId(user.getId());
                address.setAddressType("RESIDENTIAL");
                address.setIsPrimary(true);
            }
            updateAddressFromRequest(address, request.primaryAddress());
            Address savedAddress = addressRepository.save(address);
            profile.setPrimaryAddress(savedAddress);
        }

        FarmerProfile savedProfile = farmerProfileRepository.save(profile);
        return mapToFarmerProfileResponse(user, savedProfile);
    }

    public FarmerProfile createInitialFarmerProfile(User user) {
        FarmerProfile profile = new FarmerProfile();
        profile.setUserId(user.getId());
        profile.setFarmerCode("FARMER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        return farmerProfileRepository.save(profile);
    }

    public FarmerProfileResponse mapToFarmerProfileResponse(User user, FarmerProfile profile) {
        AddressResponse addressResp = profile.getPrimaryAddress() != null
            ? mapToAddressResponse(profile.getPrimaryAddress())
            : null;

        String createdAtStr = profile.getCreatedAt() != null
            ? profile.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME)
            : "";

        return new FarmerProfileResponse(
            profile.getId(),
            user.getId(),
            user.getPublicId(),
            profile.getFarmerCode(),
            user.getFullName(),
            user.getEmail(),
            user.getMobileNumber(),
            profile.getKisanCreditCardNo(),
            profile.getTotalLandAcres(),
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
