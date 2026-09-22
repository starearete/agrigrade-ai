package com.agrigrade.profile.service;

import com.agrigrade.auth.dto.UserDto;
import com.agrigrade.auth.entity.Role;
import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.common.exception.ApiException;
import com.agrigrade.crop.dto.CropDto;
import com.agrigrade.crop.entity.Crop;
import com.agrigrade.crop.repository.CropRepository;
import com.agrigrade.location.entity.District;
import com.agrigrade.location.entity.State;
import com.agrigrade.location.repository.DistrictRepository;
import com.agrigrade.location.repository.StateRepository;
import com.agrigrade.profile.dto.*;
import com.agrigrade.profile.entity.*;
import com.agrigrade.profile.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class ProfileService {

    private static final Pattern PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");
    private static final Pattern MOBILE_PATTERN = Pattern.compile("^[6-9][0-9]{9}$");

    @PersistenceContext
    private EntityManager entityManager;

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final AddressRepository addressRepository;
    private final CropRepository cropRepository;
    private final FarmerPrimaryCropRepository farmerPrimaryCropRepository;
    private final BuyerProcurementCropRepository buyerProcurementCropRepository;
    private final StateRepository stateRepository;
    private final DistrictRepository districtRepository;

    public ProfileService(
        UserRepository userRepository,
        FarmerProfileRepository farmerProfileRepository,
        BuyerProfileRepository buyerProfileRepository,
        AddressRepository addressRepository,
        CropRepository cropRepository,
        FarmerPrimaryCropRepository farmerPrimaryCropRepository,
        BuyerProcurementCropRepository buyerProcurementCropRepository,
        StateRepository stateRepository,
        DistrictRepository districtRepository
    ) {
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.buyerProfileRepository = buyerProfileRepository;
        this.addressRepository = addressRepository;
        this.cropRepository = cropRepository;
        this.farmerPrimaryCropRepository = farmerPrimaryCropRepository;
        this.buyerProcurementCropRepository = buyerProcurementCropRepository;
        this.stateRepository = stateRepository;
        this.districtRepository = districtRepository;
    }

    @Transactional(readOnly = true)
    public Object getUnifiedProfile(String publicId) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        String role = determinePrimaryRole(user);
        if ("BUYER".equalsIgnoreCase(role)) {
            return getBuyerProfile(publicId);
        } else if ("FARMER".equalsIgnoreCase(role)) {
            return getFarmerProfile(publicId);
        } else {
            // ADMIN
            Optional<FarmerProfile> fp = farmerProfileRepository.findByUserId(user.getId());
            if (fp.isPresent()) {
                return mapToFullFarmerProfile(user, fp.get());
            }
            Optional<BuyerProfile> bp = buyerProfileRepository.findByUserId(user.getId());
            if (bp.isPresent()) {
                return mapToFullBuyerProfile(user, bp.get());
            }
            return mapToFullFarmerProfile(user, createDefaultFarmerProfile(user));
        }
    }

    @Transactional(readOnly = true)
    public ProfileCompletionStatusResponse getCompletionStatus(String publicId) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        String role = determinePrimaryRole(user);
        List<String> missing = new ArrayList<>();

        if (!StringUtils.hasText(user.getFullName())) {
            missing.add("fullName");
        }
        if (!StringUtils.hasText(user.getMobileNumber())) {
            missing.add("mobileNumber");
        }

        if ("FARMER".equalsIgnoreCase(role)) {
            Optional<FarmerProfile> fpOpt = farmerProfileRepository.findByUserId(user.getId());
            if (fpOpt.isEmpty()) {
                missing.add("contactAddress");
                missing.add("farmAddress");
                missing.add("totalLandAcres");
                missing.add("primaryCrops");
            } else {
                FarmerProfile fp = fpOpt.get();
                Address contact = fp.getContactAddress() != null ? fp.getContactAddress() : fp.getPrimaryAddress();
                if (contact == null || !isValidAddress(contact)) {
                    missing.add("contactAddress");
                }
                if (!Boolean.TRUE.equals(fp.getFarmSameAsContact())) {
                    if (fp.getFarmAddress() == null || !isValidAddress(fp.getFarmAddress())) {
                        missing.add("farmAddress");
                    }
                }
                if (fp.getTotalLandAcres() == null || fp.getTotalLandAcres().compareTo(BigDecimal.ZERO) <= 0) {
                    missing.add("totalLandAcres");
                }
                List<FarmerPrimaryCrop> crops = farmerPrimaryCropRepository.findByFarmerProfileId(fp.getId());
                if (crops.isEmpty()) {
                    missing.add("primaryCrops");
                }
            }
        } else if ("BUYER".equalsIgnoreCase(role)) {
            Optional<BuyerProfile> bpOpt = buyerProfileRepository.findByUserId(user.getId());
            if (bpOpt.isEmpty()) {
                missing.add("businessName");
                missing.add("buyerType");
                missing.add("businessAddress");
                missing.add("procurementCrops");
                missing.add("purchaseCapacity");
            } else {
                BuyerProfile bp = bpOpt.get();
                if (!StringUtils.hasText(bp.getBusinessName())) missing.add("businessName");
                if (!StringUtils.hasText(bp.getBuyerType())) missing.add("buyerType");
                Address bizAddr = bp.getBusinessAddress() != null ? bp.getBusinessAddress() : bp.getPrimaryAddress();
                if (bizAddr == null || !isValidAddress(bizAddr)) {
                    missing.add("businessAddress");
                }
                List<BuyerProcurementCrop> crops = buyerProcurementCropRepository.findByBuyerProfileId(bp.getId());
                if (crops.isEmpty()) {
                    missing.add("procurementCrops");
                }
                if (!StringUtils.hasText(bp.getPurchaseCapacity())) {
                    missing.add("purchaseCapacity");
                }
            }
        }

        boolean isCompleted = missing.isEmpty() && Boolean.TRUE.equals(user.getProfileCompleted());

        return new ProfileCompletionStatusResponse(
            isCompleted,
            role,
            missing,
            user.getPreferredLanguage() != null ? user.getPreferredLanguage() : "en",
            user.getPreferredTheme() != null ? user.getPreferredTheme() : "LIGHT"
        );
    }

    @Transactional(readOnly = true)
    public FullFarmerProfileResponse getFarmerProfile(String publicId) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        String role = determinePrimaryRole(user);
        if ("BUYER".equalsIgnoreCase(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_PROFILE_ACCESS", "Access denied: User is a registered Buyer and does not have a Farmer profile.");
        }

        FarmerProfile fp = farmerProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> createDefaultFarmerProfile(user));

        return mapToFullFarmerProfile(user, fp);
    }

    @Transactional
    public FullFarmerProfileResponse saveFarmerProfile(String publicId, FarmerProfileSaveRequest request) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        String role = determinePrimaryRole(user);
        if ("BUYER".equalsIgnoreCase(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_PROFILE_ACCESS", "Access denied: User is a registered Buyer and cannot save Farmer profile.");
        }

        // Validate basic user fields
        if (StringUtils.hasText(request.fullName())) {
            user.setFullName(request.fullName().trim());
        }
        if (StringUtils.hasText(request.mobileNumber())) {
            String cleanMobile = request.mobileNumber().replaceAll("[^0-9]", "");
            if (cleanMobile.length() == 12 && cleanMobile.startsWith("91")) {
                cleanMobile = cleanMobile.substring(2);
            }
            if (!MOBILE_PATTERN.matcher(cleanMobile).matches()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_MOBILE", "Please enter a valid 10-digit Indian mobile number.");
            }
            user.setMobileNumber(cleanMobile);
        }
        if (StringUtils.hasText(request.preferredLanguage())) {
            user.setPreferredLanguage(request.preferredLanguage());
        }
        if (StringUtils.hasText(request.preferredTheme())) {
            user.setPreferredTheme(request.preferredTheme());
        }

        FarmerProfile fp = farmerProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> createDefaultFarmerProfile(user));

        // Save Contact Address
        if (request.contactAddress() != null) {
            Address contact = fp.getContactAddress() != null ? fp.getContactAddress() : new Address();
            contact.setUserId(user.getId());
            contact.setAddressType("CONTACT");
            populateAddressFromDto(contact, request.contactAddress());
            Address savedContact = addressRepository.save(contact);
            fp.setContactAddress(savedContact);
            fp.setPrimaryAddress(savedContact);
        }

        // Save Farm Address
        boolean sameAsContact = request.farmSameAsContact() == null || Boolean.TRUE.equals(request.farmSameAsContact());
        fp.setFarmSameAsContact(sameAsContact);
        if (!sameAsContact && request.farmAddress() != null) {
            Address farm = fp.getFarmAddress() != null ? fp.getFarmAddress() : new Address();
            farm.setUserId(user.getId());
            farm.setAddressType("FARM");
            populateAddressFromDto(farm, request.farmAddress());
            Address savedFarm = addressRepository.save(farm);
            fp.setFarmAddress(savedFarm);
        } else if (sameAsContact) {
            fp.setFarmAddress(fp.getContactAddress());
        }

        // Total Land Acres (>0 validation & normalization)
        if (request.totalLandAcres() != null) {
            BigDecimal acres = request.totalLandAcres();
            if (acres.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ACREAGE", "Total land acreage must be greater than 0.");
            }
            fp.setTotalLandAcres(acres.stripTrailingZeros());
        }

        // KCC (if provided, otherwise null/empty)
        if (request.kisanCreditCardNo() != null) {
            String kcc = request.kisanCreditCardNo().trim();
            fp.setKisanCreditCardNo(StringUtils.hasText(kcc) ? kcc : null);
        }

        // Primary Crops
        if (request.primaryCropIds() != null && !request.primaryCropIds().isEmpty()) {
            farmerPrimaryCropRepository.deleteByFarmerProfileId(fp.getId());
            for (Long cropId : request.primaryCropIds()) {
                Optional<Crop> cropOpt = cropRepository.findById(cropId);
                cropOpt.ifPresent(crop -> farmerPrimaryCropRepository.save(new FarmerPrimaryCrop(fp.getId(), crop)));
            }
        }

        // Mark profile completed
        user.setProfileCompleted(true);
        userRepository.save(user);

        FarmerProfile savedFp = farmerProfileRepository.save(fp);
        return mapToFullFarmerProfile(user, savedFp);
    }

    @Transactional(readOnly = true)
    public FullBuyerProfileResponse getBuyerProfile(String publicId) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        String role = determinePrimaryRole(user);
        if ("FARMER".equalsIgnoreCase(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_PROFILE_ACCESS", "Access denied: User is a registered Farmer and does not have a Buyer profile.");
        }

        BuyerProfile bp = buyerProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> createDefaultBuyerProfile(user));

        return mapToFullBuyerProfile(user, bp);
    }

    @Transactional
    public FullBuyerProfileResponse saveBuyerProfile(String publicId, BuyerProfileSaveRequest request) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        String role = determinePrimaryRole(user);
        if ("FARMER".equalsIgnoreCase(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_PROFILE_ACCESS", "Access denied: User is a registered Farmer and cannot save Buyer profile.");
        }

        if (StringUtils.hasText(request.fullName())) {
            user.setFullName(request.fullName().trim());
        }
        if (StringUtils.hasText(request.mobileNumber())) {
            String cleanMobile = request.mobileNumber().replaceAll("[^0-9]", "");
            if (cleanMobile.length() == 12 && cleanMobile.startsWith("91")) {
                cleanMobile = cleanMobile.substring(2);
            }
            if (!MOBILE_PATTERN.matcher(cleanMobile).matches()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_MOBILE", "Please enter a valid 10-digit Indian mobile number.");
            }
            user.setMobileNumber(cleanMobile);
        }
        if (StringUtils.hasText(request.preferredLanguage())) {
            user.setPreferredLanguage(request.preferredLanguage());
        }
        if (StringUtils.hasText(request.preferredTheme())) {
            user.setPreferredTheme(request.preferredTheme());
        }

        BuyerProfile bp = buyerProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> createDefaultBuyerProfile(user));

        if (StringUtils.hasText(request.businessName())) {
            bp.setBusinessName(request.businessName().trim());
        }
        if (StringUtils.hasText(request.buyerType())) {
            bp.setBuyerType(request.buyerType().trim().toUpperCase());
        }
        if (StringUtils.hasText(request.purchaseCapacity())) {
            bp.setPurchaseCapacity(request.purchaseCapacity().trim());
        }
        if (StringUtils.hasText(request.gstNumber())) {
            bp.setGstNumber(request.gstNumber().trim().toUpperCase());
        }
        if (StringUtils.hasText(request.businessRegistrationNumber())) {
            bp.setBusinessRegistrationNumber(request.businessRegistrationNumber().trim());
        }

        // Business Address
        if (request.businessAddress() != null) {
            Address address = bp.getBusinessAddress() != null ? bp.getBusinessAddress() : new Address();
            address.setUserId(user.getId());
            address.setAddressType("BUSINESS");
            populateAddressFromDto(address, request.businessAddress());
            Address savedAddress = addressRepository.save(address);
            bp.setBusinessAddress(savedAddress);
            bp.setPrimaryAddress(savedAddress);
        }

        // Procurement Crops
        if (request.procurementCropIds() != null && !request.procurementCropIds().isEmpty()) {
            buyerProcurementCropRepository.deleteByBuyerProfileId(bp.getId());
            for (Long cropId : request.procurementCropIds()) {
                Optional<Crop> cropOpt = cropRepository.findById(cropId);
                cropOpt.ifPresent(crop -> buyerProcurementCropRepository.save(new BuyerProcurementCrop(bp.getId(), crop)));
            }
        }

        user.setProfileCompleted(true);
        userRepository.save(user);

        BuyerProfile savedBp = buyerProfileRepository.save(bp);
        return mapToFullBuyerProfile(user, savedBp);
    }

    @Transactional
    public UserDto updatePreferences(String publicId, UserPreferencesRequest request) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        if (StringUtils.hasText(request.preferredLanguage())) {
            user.setPreferredLanguage(request.preferredLanguage());
        }
        if (StringUtils.hasText(request.preferredTheme())) {
            user.setPreferredTheme(request.preferredTheme());
        }
        User saved = userRepository.save(user);

        List<String> roles = user.getRoles().stream().map(Role::getCode).toList();
        return new UserDto(
            saved.getId(),
            saved.getPublicId(),
            saved.getFullName(),
            saved.getEmail(),
            saved.getMobileNumber(),
            saved.getStatus(),
            roles,
            saved.getProfileCompleted(),
            saved.getPreferredLanguage(),
            saved.getPreferredTheme(),
            saved.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME)
        );
    }

    private void populateAddressFromDto(Address target, AddressDto dto) {
        if (StringUtils.hasText(dto.addressLine1())) {
            target.setAddressLine1(dto.addressLine1().trim());
        }
        target.setAddressLine2(dto.addressLine2() != null ? dto.addressLine2().trim() : null);
        target.setVillageTownCity(dto.villageTownCity() != null ? dto.villageTownCity().trim() : null);
        target.setTaluk(dto.taluk() != null ? dto.taluk().trim() : null);
        target.setLocality(dto.locality() != null ? dto.locality().trim() : null);
        target.setLandmark(dto.landmark() != null ? dto.landmark().trim() : null);

        if (StringUtils.hasText(dto.pincode())) {
            String pin = dto.pincode().trim();
            if (!PINCODE_PATTERN.matcher(pin).matches()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PINCODE", "Please enter a valid 6-digit Indian PIN code.");
            }
            target.setPincode(pin);
        }

        if (StringUtils.hasText(dto.state())) {
            target.setState(dto.state().trim());
        }
        if (dto.stateId() != null) {
            target.setStateId(dto.stateId());
            stateRepository.findById(dto.stateId()).ifPresent(s -> target.setState(s.getName()));
        }
        if (!StringUtils.hasText(target.getState())) {
            target.setState("Tamil Nadu");
        }

        if (StringUtils.hasText(dto.district())) {
            target.setDistrict(dto.district().trim());
        }
        if (dto.districtId() != null) {
            target.setDistrictId(dto.districtId());
            districtRepository.findById(dto.districtId()).ifPresent(d -> target.setDistrict(d.getName()));
        }
        if (!StringUtils.hasText(target.getDistrict())) {
            target.setDistrict("Theni");
        }
    }

    private boolean isValidAddress(Address address) {
        return StringUtils.hasText(address.getAddressLine1())
            && StringUtils.hasText(address.getState())
            && StringUtils.hasText(address.getDistrict())
            && StringUtils.hasText(address.getPincode())
            && PINCODE_PATTERN.matcher(address.getPincode()).matches();
    }

    private String determinePrimaryRole(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return "FARMER";
        }
        for (Role r : user.getRoles()) {
            if ("BUYER".equalsIgnoreCase(r.getCode())) return "BUYER";
            if ("ADMIN".equalsIgnoreCase(r.getCode())) return "ADMIN";
        }
        return "FARMER";
    }

    private FarmerProfile createDefaultFarmerProfile(User user) {
        FarmerProfile fp = new FarmerProfile();
        fp.setUserId(user.getId());
        fp.setFarmerCode("FARMER-" + user.getId());
        return farmerProfileRepository.save(fp);
    }

    private BuyerProfile createDefaultBuyerProfile(User user) {
        BuyerProfile bp = new BuyerProfile();
        bp.setUserId(user.getId());
        bp.setBuyerCode("BUYER-" + user.getId());
        return buyerProfileRepository.save(bp);
    }

    private FullFarmerProfileResponse mapToFullFarmerProfile(User user, FarmerProfile fp) {
        List<FarmerPrimaryCrop> primaryCropsList = farmerPrimaryCropRepository.findByFarmerProfileId(fp.getId());
        List<CropDto> cropDtos = primaryCropsList.stream()
            .map(pc -> {
                Crop c = pc.getCrop();
                return new CropDto(
                    c.getId(),
                    c.getCategory() != null ? c.getCategory().getId() : null,
                    c.getCategory() != null ? c.getCategory().getName() : null,
                    c.getCode(),
                    c.getName(),
                    c.getScientificName(),
                    c.getBaseShelfLifeDays(),
                    c.getDefaultStorageCondition(),
                    c.getIsActive()
                );
            })
            .toList();

        Address contact = fp.getContactAddress() != null ? fp.getContactAddress() : fp.getPrimaryAddress();
        Address farm = fp.getFarmAddress() != null ? fp.getFarmAddress() : contact;

        return new FullFarmerProfileResponse(
            fp.getId(),
            user.getId(),
            user.getPublicId(),
            fp.getFarmerCode(),
            user.getFullName(),
            user.getEmail(),
            user.getMobileNumber(),
            fp.getKisanCreditCardNo(),
            fp.getTotalLandAcres(),
            contact != null ? mapAddressToDto(contact) : null,
            farm != null ? mapAddressToDto(farm) : null,
            fp.getFarmSameAsContact(),
            cropDtos,
            Boolean.TRUE.equals(user.getProfileCompleted()),
            user.getPreferredLanguage() != null ? user.getPreferredLanguage() : "en",
            user.getPreferredTheme() != null ? user.getPreferredTheme() : "LIGHT",
            user.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME)
        );
    }

    private FullBuyerProfileResponse mapToFullBuyerProfile(User user, BuyerProfile bp) {
        List<BuyerProcurementCrop> procurementList = buyerProcurementCropRepository.findByBuyerProfileId(bp.getId());
        List<CropDto> cropDtos = procurementList.stream()
            .map(pc -> {
                Crop c = pc.getCrop();
                return new CropDto(
                    c.getId(),
                    c.getCategory() != null ? c.getCategory().getId() : null,
                    c.getCategory() != null ? c.getCategory().getName() : null,
                    c.getCode(),
                    c.getName(),
                    c.getScientificName(),
                    c.getBaseShelfLifeDays(),
                    c.getDefaultStorageCondition(),
                    c.getIsActive()
                );
            })
            .toList();

        Address bizAddress = bp.getBusinessAddress() != null ? bp.getBusinessAddress() : bp.getPrimaryAddress();

        return new FullBuyerProfileResponse(
            bp.getId(),
            user.getId(),
            user.getPublicId(),
            bp.getBuyerCode(),
            user.getFullName(),
            user.getEmail(),
            user.getMobileNumber(),
            bp.getBusinessName(),
            bp.getBuyerType(),
            bp.getGstNumber(),
            bp.getBusinessRegistrationNumber(),
            bp.getPurchaseCapacity(),
            bizAddress != null ? mapAddressToDto(bizAddress) : null,
            cropDtos,
            Boolean.TRUE.equals(user.getProfileCompleted()),
            user.getPreferredLanguage() != null ? user.getPreferredLanguage() : "en",
            user.getPreferredTheme() != null ? user.getPreferredTheme() : "LIGHT",
            user.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME)
        );
    }

    private AddressDto mapAddressToDto(Address addr) {
        return new AddressDto(
            addr.getId(),
            addr.getAddressType(),
            addr.getAddressLine1(),
            addr.getAddressLine2(),
            addr.getVillageTownCity(),
            addr.getTaluk(),
            addr.getLocality(),
            addr.getDistrict(),
            addr.getState(),
            addr.getStateId(),
            addr.getDistrictId(),
            addr.getPincode(),
            addr.getLandmark()
        );
    }

    @Transactional
    public void deleteUserAccountPermanently(String publicId) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        Long userId = user.getId();
        Optional<FarmerProfile> fp = farmerProfileRepository.findByUserId(userId);
        Optional<BuyerProfile> bp = buyerProfileRepository.findByUserId(userId);

        Long farmerId = fp.map(FarmerProfile::getId).orElse(-1L);
        Long buyerId = bp.map(BuyerProfile::getId).orElse(-1L);

        // Delete order and purchase request domain records
        entityManager.createNativeQuery("DELETE FROM orders WHERE buyer_id = :buyerId OR farmer_id = :farmerId")
            .setParameter("buyerId", buyerId)
            .setParameter("farmerId", farmerId)
            .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM buyer_inquiries WHERE buyer_id = :buyerId OR farmer_id = :farmerId")
            .setParameter("buyerId", buyerId)
            .setParameter("farmerId", farmerId)
            .executeUpdate();

        // Delete chat messages & conversations if chat tables exist
        try {
            entityManager.createNativeQuery("DELETE FROM messages WHERE sender_id = :userId OR receiver_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();
        } catch (Exception ignored) {}

        // Delete farmer product batch domain hierarchy
        if (farmerId > 0) {
            try {
                entityManager.createNativeQuery("DELETE FROM ai_certificates WHERE batch_id IN (SELECT id FROM product_batches WHERE farmer_id = :farmerId)")
                    .setParameter("farmerId", farmerId)
                    .executeUpdate();
            } catch (Exception ignored) {}

            try {
                entityManager.createNativeQuery("DELETE FROM batch_images WHERE batch_id IN (SELECT id FROM product_batches WHERE farmer_id = :farmerId)")
                    .setParameter("farmerId", farmerId)
                    .executeUpdate();
            } catch (Exception ignored) {}

            try {
                entityManager.createNativeQuery("DELETE FROM marketplace_listings WHERE batch_id IN (SELECT id FROM product_batches WHERE farmer_id = :farmerId)")
                    .setParameter("farmerId", farmerId)
                    .executeUpdate();
            } catch (Exception ignored) {}

            try {
                entityManager.createNativeQuery("DELETE FROM quality_results WHERE analysis_id IN (SELECT id FROM ai_analyses WHERE batch_id IN (SELECT id FROM product_batches WHERE farmer_id = :farmerId))")
                    .setParameter("farmerId", farmerId)
                    .executeUpdate();
            } catch (Exception ignored) {}

            try {
                entityManager.createNativeQuery("DELETE FROM ai_analyses WHERE batch_id IN (SELECT id FROM product_batches WHERE farmer_id = :farmerId)")
                    .setParameter("farmerId", farmerId)
                    .executeUpdate();
            } catch (Exception ignored) {}

            try {
                entityManager.createNativeQuery("DELETE FROM product_batches WHERE farmer_id = :farmerId")
                    .setParameter("farmerId", farmerId)
                    .executeUpdate();
            } catch (Exception ignored) {}

            try {
                entityManager.createNativeQuery("DELETE FROM farmer_primary_crops WHERE farmer_id = :farmerId")
                    .setParameter("farmerId", farmerId)
                    .executeUpdate();
            } catch (Exception ignored) {}

            try {
                entityManager.createNativeQuery("DELETE FROM farmer_profiles WHERE id = :farmerId")
                    .setParameter("farmerId", farmerId)
                    .executeUpdate();
            } catch (Exception ignored) {}
        }

        if (buyerId > 0) {
            try {
                entityManager.createNativeQuery("DELETE FROM buyer_procurement_crops WHERE buyer_id = :buyerId")
                    .setParameter("buyerId", buyerId)
                    .executeUpdate();
            } catch (Exception ignored) {}

            try {
                entityManager.createNativeQuery("DELETE FROM buyer_profiles WHERE id = :buyerId")
                    .setParameter("buyerId", buyerId)
                    .executeUpdate();
            } catch (Exception ignored) {}
        }

        // Delete security and user entity records
        try {
            entityManager.createNativeQuery("DELETE FROM refresh_tokens WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();
        } catch (Exception ignored) {}

        try {
            entityManager.createNativeQuery("DELETE FROM addresses WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();
        } catch (Exception ignored) {}

        try {
            entityManager.createNativeQuery("DELETE FROM user_roles WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();
        } catch (Exception ignored) {}

        entityManager.createNativeQuery("DELETE FROM users WHERE id = :userId")
            .setParameter("userId", userId)
            .executeUpdate();
    }
}
