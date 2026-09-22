package com.agrigrade.profile.service;

import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.common.exception.ApiException;
import com.agrigrade.profile.dto.AddressRequest;
import com.agrigrade.profile.dto.AddressResponse;
import com.agrigrade.profile.dto.BuyerProfileResponse;
import com.agrigrade.profile.dto.BuyerProfileUpdateRequest;
import com.agrigrade.profile.entity.Address;
import com.agrigrade.profile.entity.BuyerProfile;
import com.agrigrade.profile.repository.AddressRepository;
import com.agrigrade.profile.repository.BuyerProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class BuyerProfileService {

    private final UserRepository userRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final AddressRepository addressRepository;

    public BuyerProfileService(
        UserRepository userRepository,
        BuyerProfileRepository buyerProfileRepository,
        AddressRepository addressRepository
    ) {
        this.userRepository = userRepository;
        this.buyerProfileRepository = buyerProfileRepository;
        this.addressRepository = addressRepository;
    }

    @Transactional
    public BuyerProfileResponse getBuyerProfile(String publicId) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User profile not found."));

        BuyerProfile profile = buyerProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> createInitialBuyerProfile(user));

        return mapToBuyerProfileResponse(user, profile);
    }

    @Transactional
    public BuyerProfileResponse updateBuyerProfile(String publicId, BuyerProfileUpdateRequest request) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User profile not found."));

        BuyerProfile profile = buyerProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> createInitialBuyerProfile(user));

        if (StringUtils.hasText(request.gstNumber())) {
            if (buyerProfileRepository.existsByGstNumberAndIdNot(request.gstNumber(), profile.getId())) {
                throw new ApiException(HttpStatus.CONFLICT, "DUPLICATE_GST", "GST number is already registered by another buyer.");
            }
            profile.setGstNumber(request.gstNumber());
        }

        if (StringUtils.hasText(request.fullName())) {
            user.setFullName(request.fullName());
        }
        if (StringUtils.hasText(request.mobileNumber())) {
            user.setMobileNumber(request.mobileNumber());
        }
        userRepository.save(user);

        if (StringUtils.hasText(request.businessName())) {
            profile.setBusinessName(request.businessName());
        }
        if (StringUtils.hasText(request.buyerType())) {
            profile.setBuyerType(request.buyerType());
        }

        if (request.primaryAddress() != null) {
            Address address = profile.getPrimaryAddress();
            if (address == null) {
                address = new Address();
                address.setUserId(user.getId());
                address.setAddressType("BUSINESS");
                address.setIsPrimary(true);
            }
            updateAddressFromRequest(address, request.primaryAddress());
            Address savedAddress = addressRepository.save(address);
            profile.setPrimaryAddress(savedAddress);
        }

        BuyerProfile savedProfile = buyerProfileRepository.save(profile);
        return mapToBuyerProfileResponse(user, savedProfile);
    }

    public BuyerProfile createInitialBuyerProfile(User user) {
        BuyerProfile profile = new BuyerProfile();
        profile.setUserId(user.getId());
        profile.setBuyerCode("BUYER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        profile.setBusinessName(user.getFullName() != null ? user.getFullName() + " Enterprises" : "Agri Buyer");
        profile.setBuyerType("WHOLESALER");
        return buyerProfileRepository.save(profile);
    }

    public BuyerProfileResponse mapToBuyerProfileResponse(User user, BuyerProfile profile) {
        AddressResponse addressResp = profile.getPrimaryAddress() != null
            ? mapToAddressResponse(profile.getPrimaryAddress())
            : null;

        String createdAtStr = profile.getCreatedAt() != null
            ? profile.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME)
            : "";

        return new BuyerProfileResponse(
            profile.getId(),
            user.getId(),
            user.getPublicId(),
            profile.getBuyerCode(),
            user.getFullName(),
            user.getEmail(),
            user.getMobileNumber(),
            profile.getBusinessName(),
            profile.getGstNumber(),
            profile.getBuyerType(),
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
