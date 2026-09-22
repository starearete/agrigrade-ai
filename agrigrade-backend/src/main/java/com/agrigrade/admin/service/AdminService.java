package com.agrigrade.admin.service;

import com.agrigrade.admin.dto.*;
import com.agrigrade.admin.entity.AdminAction;
import com.agrigrade.admin.repository.AdminActionRepository;
import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.common.exception.ApiException;
import com.agrigrade.listing.entity.MarketplaceListing;
import com.agrigrade.listing.repository.MarketplaceListingRepository;
import com.agrigrade.notification.entity.Notification;
import com.agrigrade.notification.repository.NotificationRepository;
import com.agrigrade.profile.entity.Address;
import com.agrigrade.profile.entity.BuyerProfile;
import com.agrigrade.profile.entity.FarmerProfile;
import com.agrigrade.profile.repository.AddressRepository;
import com.agrigrade.profile.repository.BuyerProfileRepository;
import com.agrigrade.profile.repository.FarmerProfileRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import com.agrigrade.listing.dto.MarketplaceListingResponse;
import com.agrigrade.listing.service.MarketplaceListingService;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final AddressRepository addressRepository;
    private final MarketplaceListingRepository listingRepository;
    private final AdminActionRepository adminActionRepository;
    private final NotificationRepository notificationRepository;
    private final MarketplaceListingService marketplaceListingService;

    @PersistenceContext
    private EntityManager entityManager;

    public AdminService(
            UserRepository userRepository,
            FarmerProfileRepository farmerProfileRepository,
            BuyerProfileRepository buyerProfileRepository,
            AddressRepository addressRepository,
            MarketplaceListingRepository listingRepository,
            AdminActionRepository adminActionRepository,
            NotificationRepository notificationRepository,
            MarketplaceListingService marketplaceListingService
    ) {
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.buyerProfileRepository = buyerProfileRepository;
        this.addressRepository = addressRepository;
        this.listingRepository = listingRepository;
        this.adminActionRepository = adminActionRepository;
        this.notificationRepository = notificationRepository;
        this.marketplaceListingService = marketplaceListingService;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getDashboardStats() {
        // Count only FARMER + BUYER — exclude ADMIN system accounts
        long totalUsers = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(DISTINCT u.id) FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.code IN ('FARMER','BUYER')"
        ).getSingleResult()).longValue();

        long totalFarmers = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(DISTINCT user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.code = 'FARMER'"
        ).getSingleResult()).longValue();

        long totalBuyers = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(DISTINCT user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.code = 'BUYER'"
        ).getSingleResult()).longValue();

        long activeFarmers = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(DISTINCT u.id) FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.code = 'FARMER' AND u.status = 'ACTIVE'"
        ).getSingleResult()).longValue();

        long activeBuyers = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(DISTINCT u.id) FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.code = 'BUYER' AND u.status = 'ACTIVE'"
        ).getSingleResult()).longValue();

        long suspendedUsers = 0;
        try {
            suspendedUsers = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM users WHERE UPPER(status) = 'SUSPENDED'"
            ).getSingleResult()).longValue();
        } catch (Exception ignored) {}

        long verifiedFarmers = 0;
        try {
            verifiedFarmers = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(DISTINCT uv.user_id) FROM user_verifications uv JOIN user_roles ur ON uv.user_id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.code = 'FARMER' AND uv.status = 'VERIFIED'"
            ).getSingleResult()).longValue();
        } catch (Exception ignored) {}

        long verifiedBuyers = 0;
        try {
            verifiedBuyers = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(DISTINCT uv.user_id) FROM user_verifications uv JOIN user_roles ur ON uv.user_id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.code = 'BUYER' AND uv.status = 'VERIFIED'"
            ).getSingleResult()).longValue();
        } catch (Exception ignored) {}

        long activeListings = 0;
        try {
            activeListings = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM marketplace_listings WHERE UPPER(status) = 'ACTIVE'"
            ).getSingleResult()).longValue();
        } catch (Exception ignored) {}

        long suspendedListings = 0;
        try {
            suspendedListings = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM marketplace_listings WHERE UPPER(status) = 'SUSPENDED'"
            ).getSingleResult()).longValue();
        } catch (Exception ignored) {}

        long pendingRequests = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM purchase_requests WHERE status = 'PENDING'"
        ).getSingleResult()).longValue();

        long completedTrades = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM purchase_requests WHERE status = 'ACCEPTED'"
        ).getSingleResult()).longValue();

        long totalCrops = ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM crops").getSingleResult()).longValue();
        long totalDiseases = ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM diseases").getSingleResult()).longValue();
        long totalMarkets = ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM markets").getSingleResult()).longValue();

        double listedQty = 0.0;
        try {
            Object res = entityManager.createNativeQuery("SELECT SUM(quantity_remaining) FROM marketplace_listings").getSingleResult();
            if (res != null) listedQty = ((Number) res).doubleValue();
        } catch (Exception ignored) {}

        double tradedQty = 0.0;
        try {
            Object res = entityManager.createNativeQuery("SELECT SUM(requested_quantity) FROM purchase_requests WHERE status = 'ACCEPTED'").getSingleResult();
            if (res != null) tradedQty = ((Number) res).doubleValue();
        } catch (Exception ignored) {}

        return new AdminDashboardStatsDto(
                totalUsers,
                totalFarmers,
                totalBuyers,
                activeFarmers,
                activeBuyers,
                suspendedUsers,
                verifiedFarmers,
                verifiedBuyers,
                activeListings,
                suspendedListings,
                pendingRequests,
                completedTrades,
                totalCrops,
                totalDiseases,
                totalMarkets,
                listedQty,
                tradedQty
        );
    }

    @Transactional(readOnly = true)
    public List<UserAdminDto> getAllUsers(
            String roleFilter,
            String districtFilter,
            String statusFilter,
            String verificationFilter,
            Double minAcreage,
            Double maxAcreage,
            Double minBuyingCapacity,
            String searchQuery,
            String sortOrder
    ) {
        long t0 = System.currentTimeMillis();
        Map<Long, String[]> addressMap = new HashMap<>();
        try {
            @SuppressWarnings("unchecked")
            List<Object[]> aRows = entityManager.createNativeQuery(
                    "SELECT user_id, district, taluk, village_town_city, address_line1 FROM addresses"
            ).getResultList();
            for (Object[] a : aRows) {
                if (a[0] != null) {
                    Long uid = ((Number) a[0]).longValue();
                    String dist = a[1] != null ? a[1].toString() : "Theni";
                    String tlk = a[2] != null ? a[2].toString() : "District Central";
                    String vlg = a[3] != null ? a[3].toString() : "Main Village";
                    String add1 = a[4] != null ? a[4].toString() : null;
                    addressMap.putIfAbsent(uid, new String[]{dist, tlk, vlg, add1});
                }
            }
        } catch (Exception ignored) {}
        long t1 = System.currentTimeMillis();

        Map<Long, String> verificationMap = new HashMap<>();
        try {
            List<Object[]> rows = entityManager.createNativeQuery(
                    "SELECT user_id, status FROM user_verifications ORDER BY id ASC"
            ).getResultList();
            for (Object[] r : rows) {
                if (r[0] != null && r[1] != null) {
                    verificationMap.put(((Number) r[0]).longValue(), r[1].toString());
                }
            }
        } catch (Exception ignored) {}
        long t2 = System.currentTimeMillis();

        String sql = """
            SELECT
                u.id,
                u.public_id,
                u.full_name,
                u.email,
                u.mobile_number,
                COALESCE(MAX(r.code), 'USER') as role_code,
                u.status,
                MAX(fp.total_land_acres) as total_land_acres,
                MAX(bp.purchase_capacity) as purchase_capacity,
                MAX(bp.business_name) as business_name,
                MAX(fp.farmer_code) as farmer_code,
                MAX(bp.buyer_code) as buyer_code,
                u.created_at,
                u.updated_at
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            LEFT JOIN farmer_profiles fp ON u.id = fp.user_id
            LEFT JOIN buyer_profiles bp ON u.id = bp.user_id
            WHERE u.id NOT IN (
                SELECT DISTINCT ur2.user_id FROM user_roles ur2 JOIN roles r2 ON ur2.role_id = r2.id WHERE UPPER(r2.code) = 'ADMIN'
            )
            GROUP BY u.id, u.public_id, u.full_name, u.email, u.mobile_number, u.status, u.created_at, u.updated_at
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        long t3 = System.currentTimeMillis();
        List<UserAdminDto> results = new ArrayList<>();

        for (Object[] r : rows) {
            Long id = ((Number) r[0]).longValue();
            String publicId = (String) r[1];
            String fullName = (String) r[2];
            String email = (String) r[3];
            String mobileNumber = (String) r[4];
            String roleCode = (String) r[5];
            String status = (String) r[6];
            Double acreage = r[7] != null ? ((Number) r[7]).doubleValue() : null;

            Double buyingCapacity = null;
            if (r[8] != null) {
                try {
                    buyingCapacity = Double.parseDouble(r[8].toString().replaceAll("[^0-9.]", ""));
                } catch (Exception ignored) {}
            }

            String businessName = (String) r[9];
            String farmerCode = (String) r[10];
            String buyerCode = (String) r[11];
            String createdAt = r[12] != null ? r[12].toString() : null;
            String updatedAt = r[13] != null ? r[13].toString() : null;

            String[] addrData = addressMap.get(id);
            String district = addrData != null && addrData[0] != null ? addrData[0] : "Theni";
            String taluk = addrData != null && addrData[1] != null ? addrData[1] : "District Central";
            String village = addrData != null && addrData[2] != null ? addrData[2] : "Main Village";
            String addressLine1 = addrData != null ? addrData[3] : null;
            String verificationStatus = verificationMap.getOrDefault(id, "UNVERIFIED");

            if (StringUtils.hasText(roleFilter) && !"ALL".equalsIgnoreCase(roleFilter)) {
                if (!roleCode.equalsIgnoreCase(roleFilter)) continue;
            }

            if (StringUtils.hasText(districtFilter) && !"ALL".equalsIgnoreCase(districtFilter)) {
                if (!district.equalsIgnoreCase(districtFilter)) continue;
            }

            if (StringUtils.hasText(statusFilter) && !"ALL".equalsIgnoreCase(statusFilter)) {
                if (!statusFilter.equalsIgnoreCase(status)) continue;
            }

            if (StringUtils.hasText(verificationFilter) && !"ALL".equalsIgnoreCase(verificationFilter)) {
                if (!verificationFilter.equalsIgnoreCase(verificationStatus)) continue;
            }

            if (minAcreage != null && (acreage == null || acreage < minAcreage)) continue;
            if (maxAcreage != null && (acreage == null || acreage > maxAcreage)) continue;
            if (minBuyingCapacity != null && (buyingCapacity == null || buyingCapacity < minBuyingCapacity)) continue;

            if (StringUtils.hasText(searchQuery)) {
                String q = searchQuery.toLowerCase().trim();
                boolean match = (fullName != null && fullName.toLowerCase().contains(q)) ||
                        (email != null && email.toLowerCase().contains(q)) ||
                        (mobileNumber != null && mobileNumber.contains(q)) ||
                        (farmerCode != null && farmerCode.toLowerCase().contains(q)) ||
                        (buyerCode != null && buyerCode.toLowerCase().contains(q));
                if (!match) continue;
            }

            results.add(new UserAdminDto(
                    id, publicId, fullName, email, mobileNumber, roleCode,
                    district, taluk, village, addressLine1, status, verificationStatus,
                    acreage, buyingCapacity, "Banana, Tomato", "Banana, Onion",
                    businessName, farmerCode, buyerCode, createdAt, updatedAt
            ));
        }

        if ("ZA".equalsIgnoreCase(sortOrder)) {
            results.sort((a, b) -> b.fullName().compareToIgnoreCase(a.fullName()));
        } else if ("NEWEST".equalsIgnoreCase(sortOrder)) {
            results.sort((a, b) -> String.valueOf(b.createdAt()).compareTo(String.valueOf(a.createdAt())));
        } else if ("OLDEST".equalsIgnoreCase(sortOrder)) {
            results.sort((a, b) -> String.valueOf(a.createdAt()).compareTo(String.valueOf(b.createdAt())));
        } else {
            results.sort((a, b) -> a.fullName().compareToIgnoreCase(b.fullName()));
        }

        System.out.println(">>> [PERF_LOG] getAllUsers: addressMap=" + (t1 - t0) + "ms | verificationMap=" + (t2 - t1) + "ms | mainQuery=" + (t3 - t2) + "ms | loop=" + (System.currentTimeMillis() - t3) + "ms | TOTAL=" + (System.currentTimeMillis() - t0) + "ms");

        return results;
    }

    @Transactional
    public UserAdminDto updateUserStatus(String adminPublicId, Long userId, UserStatusUpdateRequest request) {
        User adminUser = userRepository.findByPublicId(adminPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ADMIN_NOT_FOUND", "Admin user not found"));

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found with id: " + userId));

        if (StringUtils.hasText(request.status())) {
            targetUser.setStatus(request.status().toUpperCase());
        }

        String verStatus = "UNVERIFIED";
        if (StringUtils.hasText(request.verificationStatus())) {
            verStatus = request.verificationStatus().toUpperCase();
            try {
                entityManager.createNativeQuery(
                        "INSERT INTO user_verifications (user_id, verification_type, status, verified_at) VALUES (" +
                        targetUser.getId() + ", 'IDENTITY_AADHAAR', '" + verStatus + "', NOW()) " +
                        "ON DUPLICATE KEY UPDATE status = '" + verStatus + "', verified_at = NOW()"
                ).executeUpdate();
            } catch (Exception ignored) {}
        }

        userRepository.save(targetUser);

        // Audit Log
        AdminAction action = new AdminAction();
        action.setAdminUser(adminUser);
        action.setTargetUser(targetUser);
        action.setActionCode("USER_STATUS_UPDATED_" + targetUser.getStatus());
        action.setReason(StringUtils.hasText(request.reason()) ? request.reason() : "Admin status update");
        adminActionRepository.save(action);

        // Notification to user
        Notification notification = new Notification();
        notification.setUser(targetUser);
        notification.setNotificationType("ACCOUNT_" + targetUser.getStatus());
        notification.setTitle("Account Status Updated");
        notification.setBody("Your AgriGrade AI account status has been set to " + targetUser.getStatus() + ". Reason: " + action.getReason());
        notificationRepository.save(notification);

        FarmerProfile fp = farmerProfileRepository.findByUserId(userId).orElse(null);
        BuyerProfile bp = buyerProfileRepository.findByUserId(userId).orElse(null);

        return new UserAdminDto(
                targetUser.getId(),
                targetUser.getPublicId(),
                targetUser.getFullName(),
                targetUser.getEmail(),
                targetUser.getMobileNumber(),
                targetUser.getRoles().isEmpty() ? "USER" : targetUser.getRoles().iterator().next().getCode(),
                "Theni",
                "District Central",
                "Main Village",
                null,
                targetUser.getStatus(),
                verStatus,
                fp != null && fp.getTotalLandAcres() != null ? fp.getTotalLandAcres().doubleValue() : null,
                null,
                "Banana, Tomato",
                "Banana, Onion",
                bp != null ? bp.getBusinessName() : null,
                fp != null ? fp.getFarmerCode() : null,
                bp != null ? bp.getBuyerCode() : null,
                targetUser.getCreatedAt() != null ? targetUser.getCreatedAt().toString() : null,
                targetUser.getUpdatedAt() != null ? targetUser.getUpdatedAt().toString() : null
        );
    }

    @Transactional
    public MarketplaceListingResponse moderateListing(String adminPublicId, Long listingId, ListingModerationRequest request) {
        User adminUser = userRepository.findByPublicId(adminPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ADMIN_NOT_FOUND", "Admin user not found"));

        MarketplaceListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Listing not found with id: " + listingId));

        String newStatus = StringUtils.hasText(request.status()) ? request.status().toUpperCase() : "SUSPENDED";
        listing.setStatus(newStatus);
        MarketplaceListing saved = listingRepository.save(listing);

        User farmerUser = (listing.getBatch() != null && listing.getBatch().getFarmer() != null && listing.getBatch().getFarmer().getUserId() != null)
                ? userRepository.findById(listing.getBatch().getFarmer().getUserId()).orElse(null)
                : null;

        // Audit Log
        AdminAction action = new AdminAction();
        action.setAdminUser(adminUser);
        action.setTargetUser(farmerUser);
        action.setActionCode("LISTING_MODERATED_" + newStatus);
        action.setReason(StringUtils.hasText(request.reason()) ? request.reason() : "Marketplace listing moderation");
        adminActionRepository.save(action);

        // Notify Farmer
        if (farmerUser != null) {
            Notification notification = new Notification();
            notification.setUser(farmerUser);
            notification.setNotificationType("LISTING_" + newStatus);
            notification.setTitle("Listing Status Updated");
            notification.setBody("Your marketplace listing for " + listing.getListingCode() + " has been set to " + newStatus + ". Reason: " + action.getReason());
            notificationRepository.save(notification);
        }

        return marketplaceListingService.mapToResponse(saved);
    }

    @Transactional
    public void deleteListing(String adminPublicId, Long listingId, String reason) {
        User adminUser = userRepository.findByPublicId(adminPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ADMIN_NOT_FOUND", "Admin user not found"));

        MarketplaceListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Listing not found with id: " + listingId));

        String listingCode = listing.getListingCode() != null ? listing.getListingCode() : "LIST-" + listingId;

        User farmerUser = (listing.getBatch() != null && listing.getBatch().getFarmer() != null && listing.getBatch().getFarmer().getUserId() != null)
                ? userRepository.findById(listing.getBatch().getFarmer().getUserId()).orElse(null)
                : null;

        // Audit Log (create BEFORE delete so FK to admin_user is valid)
        AdminAction action = new AdminAction();
        action.setAdminUser(adminUser);
        action.setTargetUser(farmerUser);
        action.setActionCode("LISTING_DELETED");
        action.setReason(StringUtils.hasText(reason) ? reason : "Listing permanently removed by administrator.");
        adminActionRepository.save(action);

        // Notify farmer
        if (farmerUser != null) {
            Notification notification = new Notification();
            notification.setUser(farmerUser);
            notification.setNotificationType("LISTING_DELETED");
            notification.setTitle("Listing Removed");
            notification.setBody("Your marketplace listing " + listingCode + " has been permanently removed by an administrator. Reason: " + action.getReason());
            notificationRepository.save(notification);
        }

        // Clear FK-restricted child records before deleting listing
        entityManager.createNativeQuery("DELETE FROM buyer_inquiries WHERE listing_id = :lid")
                .setParameter("lid", listingId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM orders WHERE listing_id = :lid")
                .setParameter("lid", listingId).executeUpdate();

        // Hard-delete (buyer_favorites, purchase_requests, listing_visibility cascade; conversations SET NULL)
        listingRepository.delete(listing);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLogs() {
        return adminActionRepository.findAllByOrderByExecutedAtDesc().stream()
                .map(a -> new AuditLogDto(
                        a.getId(),
                        a.getAdminUser() != null ? a.getAdminUser().getId() : null,
                        a.getAdminUser() != null ? a.getAdminUser().getEmail() : null,
                        a.getAdminUser() != null ? a.getAdminUser().getFullName() : "Admin",
                        a.getTargetUser() != null ? a.getTargetUser().getId() : null,
                        a.getTargetUser() != null ? a.getTargetUser().getFullName() : null,
                        a.getActionCode(),
                        a.getReason(),
                        a.getExecutedAt() != null ? a.getExecutedAt().toString() : null
                ))
                .toList();
    }
}
