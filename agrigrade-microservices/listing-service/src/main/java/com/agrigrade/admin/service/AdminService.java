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

        long suspendedUsers = userRepository.findAll().stream()
                .filter(u -> "SUSPENDED".equalsIgnoreCase(u.getStatus()))
                .count();

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

        long activeListings = listingRepository.findAll().stream()
                .filter(l -> "ACTIVE".equalsIgnoreCase(l.getStatus()))
                .count();

        long suspendedListings = listingRepository.findAll().stream()
                .filter(l -> "SUSPENDED".equalsIgnoreCase(l.getStatus()))
                .count();

        long pendingRequests = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM purchase_requests WHERE status = 'PENDING'"
        ).getSingleResult()).longValue();

        long completedTrades = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM purchase_requests WHERE status = 'ACCEPTED'"
        ).getSingleResult()).longValue();

        long totalCrops = ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM crops").getSingleResult()).longValue();
        long totalDiseases = ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM diseases").getSingleResult()).longValue();
        long totalMarkets = ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM markets").getSingleResult()).longValue();

        double listedQty = listingRepository.findAll().stream()
                .mapToDouble(l -> l.getQuantityRemaining() != null ? l.getQuantityRemaining().doubleValue() : 0.0)
                .sum();

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
        List<User> users = userRepository.findAll();
        List<UserAdminDto> results = new ArrayList<>();

        for (User u : users) {
            String roleCode = u.getRoles().isEmpty() ? "USER" : u.getRoles().iterator().next().getCode();

            // Never surface ADMIN accounts in the user management list
            if ("ADMIN".equalsIgnoreCase(roleCode)) continue;

            if (StringUtils.hasText(roleFilter) && !"ALL".equalsIgnoreCase(roleFilter)) {
                if (!roleCode.equalsIgnoreCase(roleFilter)) continue;
            }

            FarmerProfile fp = farmerProfileRepository.findByUserId(u.getId()).orElse(null);
            BuyerProfile bp = buyerProfileRepository.findByUserId(u.getId()).orElse(null);
            List<Address> addrs = addressRepository.findByUserId(u.getId());
            Address addr = addrs.isEmpty() ? null : addrs.get(0);

            String district = addr != null ? addr.getDistrict() : "Theni";
            String taluk = addr != null ? addr.getTaluk() : "District Central";
            String village = addr != null ? addr.getVillageTownCity() : "Main Village";

            if (StringUtils.hasText(districtFilter) && !"ALL".equalsIgnoreCase(districtFilter)) {
                if (district == null || !district.equalsIgnoreCase(districtFilter)) continue;
            }

            if (StringUtils.hasText(statusFilter) && !"ALL".equalsIgnoreCase(statusFilter)) {
                if (!statusFilter.equalsIgnoreCase(u.getStatus())) continue;
            }

            String isVerifiedStr = "UNVERIFIED";
            try {
                Object vRes = entityManager.createNativeQuery(
                        "SELECT status FROM user_verifications WHERE user_id = " + u.getId() + " ORDER BY id DESC LIMIT 1"
                ).getResultList().stream().findFirst().orElse(null);
                if (vRes != null) isVerifiedStr = vRes.toString();
            } catch (Exception ignored) {}

            if (StringUtils.hasText(verificationFilter) && !"ALL".equalsIgnoreCase(verificationFilter)) {
                if (!verificationFilter.equalsIgnoreCase(isVerifiedStr)) continue;
            }

            Double acreage = fp != null && fp.getTotalLandAcres() != null ? fp.getTotalLandAcres().doubleValue() : null;
            if (minAcreage != null && (acreage == null || acreage < minAcreage)) continue;
            if (maxAcreage != null && (acreage == null || acreage > maxAcreage)) continue;

            Double buyingCapacity = null;
            if (bp != null && bp.getPurchaseCapacity() != null) {
                try { buyingCapacity = Double.parseDouble(bp.getPurchaseCapacity().replaceAll("[^0-9.]", "")); } catch (Exception ignored) {}
            }
            if (minBuyingCapacity != null && (buyingCapacity == null || buyingCapacity < minBuyingCapacity)) continue;

            if (StringUtils.hasText(searchQuery)) {
                String q = searchQuery.toLowerCase().trim();
                boolean match = u.getFullName().toLowerCase().contains(q) ||
                        (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)) ||
                        (u.getMobileNumber() != null && u.getMobileNumber().contains(q)) ||
                        (fp != null && fp.getFarmerCode() != null && fp.getFarmerCode().toLowerCase().contains(q)) ||
                        (bp != null && bp.getBuyerCode() != null && bp.getBuyerCode().toLowerCase().contains(q));
                if (!match) continue;
            }

            results.add(new UserAdminDto(
                    u.getId(),
                    u.getPublicId(),
                    u.getFullName(),
                    u.getEmail(),
                    u.getMobileNumber(),
                    roleCode,
                    district,
                    taluk,
                    village,
                    addr != null ? addr.getAddressLine1() : null,
                    u.getStatus(),
                    isVerifiedStr,
                    acreage,
                    buyingCapacity,
                    "Banana, Tomato",
                    "Banana, Onion",
                    bp != null ? bp.getBusinessName() : null,
                    fp != null ? fp.getFarmerCode() : null,
                    bp != null ? bp.getBuyerCode() : null,
                    u.getCreatedAt() != null ? u.getCreatedAt().toString() : null,
                    u.getUpdatedAt() != null ? u.getUpdatedAt().toString() : null
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

        if (StringUtils.hasText(request.verificationStatus())) {
            String vStat = request.verificationStatus().toUpperCase();
            try {
                entityManager.createNativeQuery(
                        "INSERT INTO user_verifications (user_id, verification_type, status, verified_at) VALUES (" +
                        targetUser.getId() + ", 'IDENTITY_AADHAAR', '" + vStat + "', NOW()) " +
                        "ON DUPLICATE KEY UPDATE status = '" + vStat + "', verified_at = NOW()"
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

        return getAllUsers("ALL", "ALL", "ALL", "ALL", null, null, null, null, "AZ").stream()
                .filter(u -> u.id().equals(userId))
                .findFirst()
                .orElse(null);
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
