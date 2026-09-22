package com.agrigrade.trade.service;

import com.agrigrade.ai.entity.AiCertificate;
import com.agrigrade.ai.repository.AiCertificateRepository;
import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.batch.entity.ProductBatch;
import com.agrigrade.batch.repository.ProductBatchRepository;
import com.agrigrade.chat.service.ChatService;
import com.agrigrade.common.exception.ApiException;
import com.agrigrade.listing.entity.MarketplaceListing;
import com.agrigrade.listing.repository.MarketplaceListingRepository;
import com.agrigrade.listing.service.ShelfLifeCalculator;
import com.agrigrade.profile.entity.BuyerProfile;
import com.agrigrade.profile.entity.FarmerProfile;
import com.agrigrade.profile.repository.BuyerProfileRepository;
import com.agrigrade.profile.repository.FarmerProfileRepository;
import com.agrigrade.trade.dto.*;
import com.agrigrade.trade.entity.PurchaseRequest;
import com.agrigrade.trade.entity.TradeOrder;
import com.agrigrade.trade.repository.PurchaseRequestRepository;
import com.agrigrade.trade.repository.TradeOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.agrigrade.chat.entity.Conversation;
import com.agrigrade.chat.repository.ConversationRepository;
import com.agrigrade.notification.service.NotificationService;

@Service
public class TradeService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final TradeOrderRepository orderRepository;
    private final MarketplaceListingRepository listingRepository;
    private final UserRepository userRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final ProductBatchRepository batchRepository;
    private final AiCertificateRepository aiCertificateRepository;
    private final ShelfLifeCalculator shelfLifeCalculator;
    private final ChatService chatService;
    private final ConversationRepository conversationRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public TradeService(
            PurchaseRequestRepository purchaseRequestRepository,
            TradeOrderRepository orderRepository,
            MarketplaceListingRepository listingRepository,
            UserRepository userRepository,
            BuyerProfileRepository buyerProfileRepository,
            FarmerProfileRepository farmerProfileRepository,
            ProductBatchRepository batchRepository,
            AiCertificateRepository aiCertificateRepository,
            ShelfLifeCalculator shelfLifeCalculator,
            ChatService chatService,
            ConversationRepository conversationRepository,
            NotificationService notificationService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.orderRepository = orderRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.buyerProfileRepository = buyerProfileRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.batchRepository = batchRepository;
        this.aiCertificateRepository = aiCertificateRepository;
        this.shelfLifeCalculator = shelfLifeCalculator;
        this.chatService = chatService;
        this.conversationRepository = conversationRepository;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public PurchaseRequestResponse createPurchaseRequest(String userPublicId, CreatePurchaseRequestDto requestDto) {
        User buyerUser = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        if (!buyerUser.hasRole("BUYER") && !buyerUser.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "BUYER_REQUIRED", "Only authenticated buyers can submit purchase requests");
        }

        BuyerProfile buyerProfile = buyerProfileRepository.findByUserId(buyerUser.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "BUYER_PROFILE_REQUIRED", "Buyer profile must be completed before requesting produce"));

        // Idempotency check with clientRequestId
        if (requestDto.clientRequestId() != null && !requestDto.clientRequestId().isBlank()) {
            Optional<PurchaseRequest> existingReq = purchaseRequestRepository.findByBuyerUserIdAndClientRequestId(buyerUser.getId(), requestDto.clientRequestId());
            if (existingReq.isPresent()) {
                return mapToRequestResponse(existingReq.get());
            }
        }

        MarketplaceListing listing = listingRepository.findById(requestDto.listingId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Marketplace listing not found with ID: " + requestDto.listingId()));

        if (!"ACTIVE".equalsIgnoreCase(listing.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LISTING_NOT_ACTIVE", "Cannot submit purchase request on an inactive listing");
        }

        ProductBatch batch = listing.getBatch();
        User farmerUser = userRepository.findById(batch.getFarmer().getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARMER_NOT_FOUND", "Farmer user not found"));

        if (farmerUser.getId().equals(buyerUser.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CANNOT_PURCHASE_OWN_LISTING", "Farmers cannot purchase their own marketplace listings");
        }

        // Verify remaining shelf life
        AiCertificate cert = aiCertificateRepository.findFirstByBatchIdOrderByIssuedAtDesc(batch.getId()).orElse(null);
        String assignedGrade = (cert != null && cert.getQualityResult() != null)
                ? cert.getQualityResult().getAssignedGrade().name()
                : "GRADE_A_PREMIUM";
        Double qualityScore = (cert != null && cert.getQualityResult() != null)
                ? cert.getQualityResult().getQualityScore().doubleValue()
                : 95.0;

        var shelfLifeResult = shelfLifeCalculator.calculate(batch, assignedGrade, qualityScore, LocalDate.now());
        if (shelfLifeResult.remainingShelfLifeDays() <= 0.0 || "EXPIRED".equalsIgnoreCase(shelfLifeResult.shelfLifeStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LISTING_EXPIRED", "Listing has reached its shelf-life expiry date and cannot accept new purchase requests");
        }

        BigDecimal requestedQty = requestDto.requestedQuantity();
        if (requestedQty == null || requestedQty.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUANTITY", "Requested quantity must be positive");
        }

        if (requestedQty.compareTo(listing.getQuantityRemaining()) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EXCEEDS_AVAILABLE_QUANTITY", "Requested quantity (" + requestedQty + ") exceeds available listing load (" + listing.getQuantityRemaining() + ")");
        }

        BigDecimal pricePerKg = requestDto.getEffectivePrice();
        if (pricePerKg != null && pricePerKg.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PRICE", "Offered price must be positive");
        }
        if (pricePerKg == null || pricePerKg.compareTo(BigDecimal.ZERO) == 0) {
            pricePerKg = listing.getAskingPricePerUnit();
        }

        // Check duplicate active pending request
        boolean hasDuplicate = purchaseRequestRepository.existsByBuyerUserIdAndListingIdAndStatusIn(
                buyerUser.getId(),
                listing.getId(),
                Set.of(PurchaseRequest.Status.PENDING, PurchaseRequest.Status.COUNTER_OFFER)
        );
        if (hasDuplicate) {
            throw new ApiException(HttpStatus.CONFLICT, "DUPLICATE_ACTIVE_REQUEST", "You already have an active purchase request for this listing.");
        }

        BigDecimal totalPrice = requestedQty.multiply(pricePerKg);
        String publicId = "REQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PurchaseRequest pr = new PurchaseRequest(
                publicId,
                requestDto.clientRequestId(),
                listing,
                buyerUser,
                farmerUser,
                requestedQty,
                pricePerKg,
                totalPrice,
                requestDto.getEffectiveMessage()
        );

        // Link to single conversation
        Conversation conversation = conversationRepository.findActiveConversationBetween(farmerUser.getId(), buyerUser.getId())
                .orElseGet(() -> {
                    Conversation c = new Conversation(farmerUser, buyerUser, listing);
                    return conversationRepository.save(c);
                });
        pr.setConversation(conversation);

        pr = purchaseRequestRepository.save(pr);

        // Real-Time STOMP WebSocket Event Notification
        notifyWebSocketEvent(farmerUser.getPublicId(), "PURCHASE_REQUEST_CREATED", mapToRequestResponse(pr));
        notifyWebSocketEvent(buyerUser.getPublicId(), "PURCHASE_REQUEST_CREATED", mapToRequestResponse(pr));

        // Persistent Notification for Farmer
        String cropName = (batch.getVariety() != null && batch.getVariety().getCrop() != null)
                ? batch.getVariety().getCrop().getName() : "Produce";
        String varietyName = (batch.getVariety() != null) ? batch.getVariety().getName() : "";
        notificationService.createNotification(
                farmerUser,
                "Purchase Request: " + cropName,
                buyerUser.getFullName() + " requested to buy " + requestedQty.toPlainString() + " KG of " + cropName + (varietyName.isBlank() ? "" : " (" + varietyName + ")") + " at ₹" + pricePerKg.toPlainString() + "/KG.",
                "PURCHASE_REQUEST",
                "PURCHASE_REQUEST",
                pr.getId()
        );

        // Post Real-Time Chat Structured Message
        String chatMsg = String.format("🛒 PURCHASE REQUEST: %s KG of %s at ₹%s/KG (Total: ₹%s). Status: PENDING.",
                requestedQty.toPlainString(), cropName, pricePerKg.toPlainString(), totalPrice.toPlainString());
        chatService.sendStructuredPurchaseRequestMessage(buyerUser, farmerUser, listing, chatMsg, pr.getId());

        return mapToRequestResponse(pr);
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestResponse> getBuyerPurchaseRequests(String userPublicId) {
        User buyerUser = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        List<PurchaseRequest> list = purchaseRequestRepository.findByBuyerUserIdOrderByCreatedAtDesc(buyerUser.getId());
        return list.stream().map(this::mapToRequestResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestResponse> getFarmerPurchaseRequests(String userPublicId) {
        User farmerUser = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        List<PurchaseRequest> list = purchaseRequestRepository.findByFarmerUserIdPrioritized(farmerUser.getId());
        return list.stream().map(this::mapToRequestResponse).toList();
    }

    @Transactional(readOnly = true)
    public PurchaseRequestResponse getPurchaseRequestDetail(String userPublicId, Long requestId) {
        User caller = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        PurchaseRequest pr = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "REQUEST_NOT_FOUND", "Purchase request not found with ID: " + requestId));

        if (!pr.getBuyerUser().getId().equals(caller.getId()) &&
            !pr.getFarmerUser().getId().equals(caller.getId()) &&
            !caller.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNAUTHORIZED_REQUEST_ACCESS", "You are not authorized to view this purchase request.");
        }

        return mapToRequestResponse(pr);
    }

    @Transactional
    public PurchaseRequestResponse acceptPurchaseRequest(String farmerPublicId, Long requestId) {
        User farmerUser = userRepository.findByPublicId(farmerPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        PurchaseRequest pr = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "REQUEST_NOT_FOUND", "Purchase request not found with ID: " + requestId));

        if (!pr.getFarmerUser().getId().equals(farmerUser.getId()) && !farmerUser.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNAUTHORIZED_ACCEPTANCE", "You are not authorized to accept this purchase request.");
        }

        if (pr.getStatus() == PurchaseRequest.Status.ACCEPTED) {
            return mapToRequestResponse(pr);
        }

        if (pr.getStatus() != PurchaseRequest.Status.PENDING && pr.getStatus() != PurchaseRequest.Status.COUNTER_OFFER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "REQUEST_NOT_ACTIONABLE", "Purchase request is not in an actionable state (Current status: " + pr.getStatus() + ")");
        }

        MarketplaceListing listing = pr.getListing();
        if (!"ACTIVE".equalsIgnoreCase(listing.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LISTING_NOT_ACTIVE", "Cannot accept request on an inactive or withdrawn listing.");
        }

        ProductBatch batch = listing.getBatch();
        AiCertificate cert = aiCertificateRepository.findFirstByBatchIdOrderByIssuedAtDesc(batch.getId()).orElse(null);
        String assignedGrade = (cert != null && cert.getQualityResult() != null)
                ? cert.getQualityResult().getAssignedGrade().name()
                : "GRADE_A_PREMIUM";
        Double qualityScore = (cert != null && cert.getQualityResult() != null)
                ? cert.getQualityResult().getQualityScore().doubleValue()
                : 95.0;

        var shelfLifeResult = shelfLifeCalculator.calculate(batch, assignedGrade, qualityScore, LocalDate.now());
        if (shelfLifeResult.remainingShelfLifeDays() <= 0.0 || "EXPIRED".equalsIgnoreCase(shelfLifeResult.shelfLifeStatus())) {
            pr.setStatus(PurchaseRequest.Status.EXPIRED);
            pr.setRespondedAt(LocalDateTime.now());
            purchaseRequestRepository.save(pr);
            throw new ApiException(HttpStatus.BAD_REQUEST, "LISTING_EXPIRED", "Listing has expired. Purchase request marked as EXPIRED.");
        }

        BigDecimal acceptQty = pr.getStatus() == PurchaseRequest.Status.COUNTER_OFFER && pr.getCounterQuantity() != null
                ? pr.getCounterQuantity()
                : pr.getRequestedQuantity();

        BigDecimal acceptPrice = pr.getStatus() == PurchaseRequest.Status.COUNTER_OFFER && pr.getCounterPricePerKg() != null
                ? pr.getCounterPricePerKg()
                : pr.getOfferedPricePerKg();

        // Concurrency & Atomic Inventory check using atomic decrement
        int updatedRows = listingRepository.decrementQuantityRemaining(listing.getId(), acceptQty);
        if (updatedRows == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "INSUFFICIENT_LISTING_QUANTITY", "Remaining listing quantity is insufficient for requested " + acceptQty + " KG.");
        }

        // Reload listing after atomic decrement to get exact updated quantity
        MarketplaceListing updatedListing = listingRepository.findById(listing.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Listing not found"));

        if (updatedListing.getQuantityRemaining().compareTo(BigDecimal.ZERO) <= 0) {
            batch.setStatus("SOLD_OUT");
            batchRepository.save(batch);
            updatedListing.setStatus("SOLD_OUT");
            listingRepository.save(updatedListing);
        }

        // Mark request accepted
        pr.setStatus(PurchaseRequest.Status.ACCEPTED);
        pr.setRespondedAt(LocalDateTime.now());
        pr = purchaseRequestRepository.save(pr);

        // Create B2B Trade Order in orders table
        BuyerProfile buyerProfile = buyerProfileRepository.findByUserId(pr.getBuyerUser().getId()).orElse(null);
        if (buyerProfile == null) {
            buyerProfile = new BuyerProfile();
            buyerProfile.setUserId(pr.getBuyerUser().getId());
            buyerProfile.setBuyerCode("BUY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            buyerProfile.setBusinessName(pr.getBuyerUser().getFullName() + " Traders");
            buyerProfile.setBuyerType("WHOLESALER");
            buyerProfile = buyerProfileRepository.save(buyerProfile);
        }

        FarmerProfile farmerProfile = farmerProfileRepository.findByUserId(farmerUser.getId()).orElse(null);
        if (farmerProfile == null) {
            farmerProfile = new FarmerProfile();
            farmerProfile.setUserId(farmerUser.getId());
            farmerProfile.setFarmerCode("FAR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            farmerProfile = farmerProfileRepository.save(farmerProfile);
        }

        String cropCode = (batch.getVariety() != null && batch.getVariety().getCrop() != null && batch.getVariety().getCrop().getCode() != null)
                ? batch.getVariety().getCrop().getCode().toUpperCase()
                : "CROP";

        String orderNumber = "ORD-" + cropCode + "-" + (System.currentTimeMillis() % 10000000);
        BigDecimal totalAmount = acceptPrice.multiply(acceptQty);

        TradeOrder order = new TradeOrder(
                orderNumber,
                updatedListing,
                buyerProfile,
                farmerProfile,
                acceptPrice,
                acceptQty,
                totalAmount
        );
        orderRepository.save(order);

        // Real-Time STOMP Notifications
        notifyWebSocketEvent(pr.getBuyerUser().getPublicId(), "PURCHASE_REQUEST_ACCEPTED", mapToRequestResponse(pr));
        notifyWebSocketEvent(farmerUser.getPublicId(), "PURCHASE_REQUEST_ACCEPTED", mapToRequestResponse(pr));

        // Persistent Notification for Buyer
        String cropName = (batch.getVariety() != null && batch.getVariety().getCrop() != null)
                ? batch.getVariety().getCrop().getName() : "Produce";
        notificationService.createNotification(
                pr.getBuyerUser(),
                "Purchase Request Accepted",
                farmerUser.getFullName() + " accepted your request for " + acceptQty.toPlainString() + " KG of " + cropName + " at ₹" + acceptPrice.toPlainString() + "/KG.",
                "PURCHASE_REQUEST_ACCEPTED",
                "PURCHASE_REQUEST",
                pr.getId()
        );

        Map<String, Object> qtyUpdatePayload = Map.of(
                "listingId", updatedListing.getId(),
                "quantityRemaining", updatedListing.getQuantityRemaining(),
                "status", updatedListing.getStatus()
        );
        notifyWebSocketEvent(farmerUser.getPublicId(), "LISTING_QUANTITY_UPDATED", qtyUpdatePayload);
        notifyWebSocketEvent(pr.getBuyerUser().getPublicId(), "LISTING_QUANTITY_UPDATED", qtyUpdatePayload);

        try {
            messagingTemplate.convertAndSend("/topic/marketplace", Map.of(
                    "eventId", UUID.randomUUID().toString(),
                    "type", "LISTING_QUANTITY_UPDATED",
                    "listingId", updatedListing.getId(),
                    "quantityRemaining", updatedListing.getQuantityRemaining(),
                    "status", updatedListing.getStatus()
            ));
        } catch (Exception ignored) {}

        if ("SOLD_OUT".equals(updatedListing.getStatus())) {
            notifyWebSocketEvent(farmerUser.getPublicId(), "LISTING_SOLD_OUT", Map.of("listingId", updatedListing.getId()));
            notifyWebSocketEvent(pr.getBuyerUser().getPublicId(), "LISTING_SOLD_OUT", Map.of("listingId", updatedListing.getId()));
            notificationService.createNotification(
                    farmerUser,
                    "Listing Sold Out: " + cropName,
                    "Your listing for " + cropName + " (Batch #" + batch.getId() + ") is now completely SOLD OUT.",
                    "LISTING_SOLD_OUT",
                    "LISTING",
                    updatedListing.getId()
            );
        }

        // Chat System Message
        chatService.sendSystemMessage(farmerUser, pr.getBuyerUser(), updatedListing,
                "Purchase request accepted. Trade Order " + orderNumber + " created for " + acceptQty.toPlainString() + " KG at ₹" + acceptPrice.toPlainString() + "/KG. Status: ACCEPTED");

        return mapToRequestResponse(pr);
    }

    @Transactional
    public PurchaseRequestResponse rejectPurchaseRequest(String farmerPublicId, Long requestId, RejectRequestDto rejectDto) {
        User farmerUser = userRepository.findByPublicId(farmerPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        PurchaseRequest pr = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "REQUEST_NOT_FOUND", "Purchase request not found with ID: " + requestId));

        if (!pr.getFarmerUser().getId().equals(farmerUser.getId()) && !farmerUser.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNAUTHORIZED_REJECTION", "You are not authorized to reject this purchase request.");
        }

        if (pr.getStatus() == PurchaseRequest.Status.DECLINED || pr.getStatus() == PurchaseRequest.Status.REJECTED) {
            return mapToRequestResponse(pr);
        }

        if (pr.getStatus() != PurchaseRequest.Status.PENDING && pr.getStatus() != PurchaseRequest.Status.COUNTER_OFFER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "REQUEST_NOT_ACTIONABLE", "Purchase request is not actionable.");
        }

        pr.setStatus(PurchaseRequest.Status.DECLINED);
        pr.setRespondedAt(LocalDateTime.now());
        if (rejectDto != null && rejectDto.reason() != null) {
            pr.setFarmerResponseMessage(rejectDto.reason());
        }
        pr = purchaseRequestRepository.save(pr);

        notifyWebSocketEvent(pr.getBuyerUser().getPublicId(), "PURCHASE_REQUEST_DECLINED", mapToRequestResponse(pr));
        notifyWebSocketEvent(farmerUser.getPublicId(), "PURCHASE_REQUEST_DECLINED", mapToRequestResponse(pr));

        String cropName = (pr.getListing() != null && pr.getListing().getBatch() != null &&
                pr.getListing().getBatch().getVariety() != null && pr.getListing().getBatch().getVariety().getCrop() != null)
                ? pr.getListing().getBatch().getVariety().getCrop().getName() : "Produce";

        notificationService.createNotification(
                pr.getBuyerUser(),
                "Purchase Request Declined",
                "Your purchase request for " + pr.getRequestedQuantity().toPlainString() + " KG of " + cropName + " was declined by " + farmerUser.getFullName() + ".",
                "PURCHASE_REQUEST_DECLINED",
                "PURCHASE_REQUEST",
                pr.getId()
        );

        chatService.sendSystemMessage(farmerUser, pr.getBuyerUser(), pr.getListing(), "Farmer declined the purchase request. Status: DECLINED");

        return mapToRequestResponse(pr);
    }

    @Transactional
    public PurchaseRequestResponse counterPurchaseRequest(String farmerPublicId, Long requestId, CounterOfferRequestDto counterDto) {
        User farmerUser = userRepository.findByPublicId(farmerPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        PurchaseRequest pr = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "REQUEST_NOT_FOUND", "Purchase request not found with ID: " + requestId));

        if (!pr.getFarmerUser().getId().equals(farmerUser.getId()) && !farmerUser.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNAUTHORIZED_COUNTER", "You are not authorized to counter this purchase request.");
        }

        if (pr.getStatus() != PurchaseRequest.Status.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "REQUEST_NOT_ACTIONABLE", "Only PENDING purchase requests can receive counter offers.");
        }

        MarketplaceListing listing = pr.getListing();
        if (counterDto.counterQuantity().compareTo(listing.getQuantityRemaining()) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EXCEEDS_AVAILABLE_QUANTITY", "Counter quantity (" + counterDto.counterQuantity() + ") exceeds available load (" + listing.getQuantityRemaining() + ").");
        }

        pr.setStatus(PurchaseRequest.Status.COUNTER_OFFER);
        pr.setCounterQuantity(counterDto.counterQuantity());
        pr.setCounterPricePerKg(counterDto.counterPricePerKg());
        if (counterDto.message() != null) {
            pr.setFarmerResponseMessage(counterDto.message());
        }
        pr.setRespondedAt(LocalDateTime.now());
        pr = purchaseRequestRepository.save(pr);

        notifyWebSocketEvent(pr.getBuyerUser().getPublicId(), "PURCHASE_REQUEST_COUNTER_OFFER", mapToRequestResponse(pr));
        chatService.sendSystemMessage(farmerUser, pr.getBuyerUser(), pr.getListing(),
                "Farmer made a counter offer: " + counterDto.counterQuantity().toPlainString() + " KG at ₹" + counterDto.counterPricePerKg().toPlainString() + "/KG.");

        return mapToRequestResponse(pr);
    }

    @Transactional
    public PurchaseRequestResponse acceptCounterOffer(String buyerPublicId, Long requestId) {
        User buyerUser = userRepository.findByPublicId(buyerPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        PurchaseRequest pr = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "REQUEST_NOT_FOUND", "Purchase request not found with ID: " + requestId));

        if (!pr.getBuyerUser().getId().equals(buyerUser.getId()) && !buyerUser.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNAUTHORIZED_ACCEPTANCE", "You are not authorized to accept this counter offer.");
        }

        if (pr.getStatus() != PurchaseRequest.Status.COUNTER_OFFER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NOT_IN_COUNTER_OFFER_STATE", "Request is not in COUNTER_OFFER status");
        }

        MarketplaceListing listing = pr.getListing();
        BigDecimal acceptQty = pr.getCounterQuantity();
        BigDecimal acceptPrice = pr.getCounterPricePerKg();

        int updatedRows = listingRepository.decrementQuantityRemaining(listing.getId(), acceptQty);
        if (updatedRows == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "INSUFFICIENT_LISTING_QUANTITY", "Remaining quantity insufficient for counter offer.");
        }

        MarketplaceListing updatedListing = listingRepository.findById(listing.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Listing not found"));

        if (updatedListing.getQuantityRemaining().compareTo(BigDecimal.ZERO) <= 0) {
            ProductBatch batch = updatedListing.getBatch();
            if (batch != null) {
                batch.setStatus("SOLD_OUT");
                batchRepository.save(batch);
            }
        }

        pr.setStatus(PurchaseRequest.Status.ACCEPTED);
        pr.setRespondedAt(LocalDateTime.now());
        pr = purchaseRequestRepository.save(pr);

        BuyerProfile buyerProfile = buyerProfileRepository.findByUserId(buyerUser.getId()).orElse(null);
        if (buyerProfile == null) {
            buyerProfile = new BuyerProfile();
            buyerProfile.setUserId(buyerUser.getId());
            buyerProfile.setBuyerCode("BUY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            buyerProfile.setBusinessName(buyerUser.getFullName() + " Traders");
            buyerProfile.setBuyerType("WHOLESALER");
            buyerProfile = buyerProfileRepository.save(buyerProfile);
        }

        FarmerProfile farmerProfile = farmerProfileRepository.findByUserId(pr.getFarmerUser().getId()).orElse(null);
        if (farmerProfile == null) {
            farmerProfile = new FarmerProfile();
            farmerProfile.setUserId(pr.getFarmerUser().getId());
            farmerProfile.setFarmerCode("FAR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            farmerProfile = farmerProfileRepository.save(farmerProfile);
        }

        ProductBatch batch = updatedListing.getBatch();
        String cropCode = (batch != null && batch.getVariety() != null && batch.getVariety().getCrop() != null && batch.getVariety().getCrop().getCode() != null)
                ? batch.getVariety().getCrop().getCode().toUpperCase()
                : "CROP";

        String orderNumber = "ORD-" + cropCode + "-" + (System.currentTimeMillis() % 10000000);
        BigDecimal totalAmount = acceptPrice.multiply(acceptQty);

        TradeOrder order = new TradeOrder(
                orderNumber,
                updatedListing,
                buyerProfile,
                farmerProfile,
                acceptPrice,
                acceptQty,
                totalAmount
        );
        orderRepository.save(order);

        notifyWebSocketEvent(pr.getFarmerUser().getPublicId(), "PURCHASE_REQUEST_ACCEPTED", mapToRequestResponse(pr));
        notifyWebSocketEvent(buyerUser.getPublicId(), "PURCHASE_REQUEST_ACCEPTED", mapToRequestResponse(pr));

        return mapToRequestResponse(pr);
    }

    @Transactional
    public PurchaseRequestResponse cancelPurchaseRequest(String buyerPublicId, Long requestId) {
        User buyerUser = userRepository.findByPublicId(buyerPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        PurchaseRequest pr = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "REQUEST_NOT_FOUND", "Purchase request not found with ID: " + requestId));

        if (!pr.getBuyerUser().getId().equals(buyerUser.getId()) && !buyerUser.hasRole("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNAUTHORIZED_CANCELLATION", "You are not authorized to cancel this purchase request.");
        }

        if (pr.getStatus() != PurchaseRequest.Status.PENDING && pr.getStatus() != PurchaseRequest.Status.COUNTER_OFFER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "REQUEST_NOT_ACTIONABLE", "Cannot cancel request in status: " + pr.getStatus());
        }

        pr.setStatus(PurchaseRequest.Status.CANCELLED);
        pr.setRespondedAt(LocalDateTime.now());
        pr = purchaseRequestRepository.save(pr);

        notifyWebSocketEvent(pr.getFarmerUser().getPublicId(), "PURCHASE_REQUEST_CANCELLED", mapToRequestResponse(pr));
        chatService.sendSystemMessage(buyerUser, pr.getFarmerUser(), pr.getListing(), "Buyer cancelled the purchase request.");

        return mapToRequestResponse(pr);
    }

    @Transactional(readOnly = true)
    public List<TradeOrderResponse> getBuyerOrders(String userPublicId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        BuyerProfile buyer = buyerProfileRepository.findByUserId(user.getId()).orElse(null);
        if (buyer == null) {
            return List.of();
        }

        List<TradeOrder> orders = orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        return orders.stream().map(this::mapToOrderResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TradeOrderResponse> getFarmerOrders(String userPublicId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        FarmerProfile farmer = farmerProfileRepository.findByUserId(user.getId()).orElse(null);
        if (farmer == null) {
            return List.of();
        }

        List<TradeOrder> orders = orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmer.getId());
        return orders.stream().map(this::mapToOrderResponse).toList();
    }

    private void notifyWebSocketEvent(String userPublicId, String eventType, Object payload) {
        try {
            String eventId = UUID.randomUUID().toString();
            Map<String, Object> eventData = Map.of(
                    "eventId", eventId,
                    "type", eventType,
                    "eventType", eventType,
                    "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                    "data", payload,
                    "payload", payload
            );
            messagingTemplate.convertAndSendToUser(userPublicId, "/queue/purchase-requests", eventData);
            messagingTemplate.convertAndSendToUser(userPublicId, "/queue/messages", eventData);
        } catch (Exception ignored) {
            // Non-blocking WebSocket delivery
        }
    }

    private PurchaseRequestResponse mapToRequestResponse(PurchaseRequest pr) {
        MarketplaceListing l = pr.getListing();
        ProductBatch b = l != null ? l.getBatch() : null;

        String cropName = (b != null && b.getVariety() != null && b.getVariety().getCrop() != null)
                ? b.getVariety().getCrop().getName() : "Produce";

        String varietyName = (b != null && b.getVariety() != null)
                ? b.getVariety().getName() : "Standard";

        String buyerName = pr.getBuyerUser() != null ? pr.getBuyerUser().getFullName() : "Buyer";
        String buyerDistrict = "Dindigul";
        String buyerBusinessName = buyerName + " Traders";
        String buyerVerificationStatus = "VERIFIED";

        BuyerProfile buyerProfile = buyerProfileRepository.findByUserId(pr.getBuyerUser().getId()).orElse(null);
        if (buyerProfile != null) {
            if (buyerProfile.getBusinessName() != null && !buyerProfile.getBusinessName().isBlank()) {
                buyerBusinessName = buyerProfile.getBusinessName();
            }
            if (buyerProfile.getBusinessAddress() != null && buyerProfile.getBusinessAddress().getDistrict() != null) {
                buyerDistrict = buyerProfile.getBusinessAddress().getDistrict();
            }
        }

        String farmerName = pr.getFarmerUser() != null ? pr.getFarmerUser().getFullName() : "Farmer";
        String quantityUnit = b != null && b.getQuantityUnit() != null ? b.getQuantityUnit() : "KG";

        String certNumber = "AGRI-CERT-2026";
        Double qualityScore = 95.0;
        Double shelfLifeDays = 14.0;
        String harvestDate = b != null && b.getHarvestDate() != null ? b.getHarvestDate().toString() : "";

        if (b != null) {
            AiCertificate cert = aiCertificateRepository.findFirstByBatchIdOrderByIssuedAtDesc(b.getId()).orElse(null);
            if (cert != null) {
                certNumber = cert.getCertificateNumber();
                if (cert.getQualityResult() != null && cert.getQualityResult().getQualityScore() != null) {
                    qualityScore = cert.getQualityResult().getQualityScore().doubleValue();
                }
            }
        }

        return new PurchaseRequestResponse(
                pr.getId(),
                pr.getRequestPublicId(),
                pr.getRequestPublicId(),
                l != null ? l.getId() : 0L,
                l != null ? l.getListingCode() : "",
                cropName,
                varietyName,
                pr.getBuyerUser().getId(),
                buyerName,
                buyerBusinessName,
                buyerDistrict,
                buyerVerificationStatus,
                pr.getFarmerUser().getId(),
                farmerName,
                pr.getOfferedPricePerKg(),
                pr.getOfferedPricePerKg(),
                l != null ? l.getAskingPricePerUnit() : BigDecimal.ZERO,
                pr.getRequestedQuantity(),
                pr.getRequestedTotalPrice(),
                quantityUnit,
                pr.getBuyerMessage(),
                pr.getBuyerMessage(),
                pr.getStatus().name(),
                pr.getCounterPricePerKg(),
                pr.getCounterQuantity(),
                pr.getFarmerResponseMessage(),
                l != null ? l.getQuantityRemaining() : BigDecimal.ZERO,
                "GRADE_A_PREMIUM",
                certNumber,
                qualityScore,
                shelfLifeDays,
                harvestDate,
                pr.getCreatedAt() != null ? pr.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "",
                pr.getUpdatedAt() != null ? pr.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "",
                pr.getRespondedAt() != null ? pr.getRespondedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null,
                pr.getExpiresAt() != null ? pr.getExpiresAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null
        );
    }

    private TradeOrderResponse mapToOrderResponse(TradeOrder o) {
        MarketplaceListing l = o.getListing();
        ProductBatch b = l != null ? l.getBatch() : null;

        String cropName = (b != null && b.getVariety() != null && b.getVariety().getCrop() != null)
                ? b.getVariety().getCrop().getName() : "Produce";

        String varietyName = (b != null && b.getVariety() != null)
                ? b.getVariety().getName() : "Standard";

        String buyerName = "Buyer";
        if (o.getBuyer() != null && o.getBuyer().getUserId() != null) {
            buyerName = userRepository.findById(o.getBuyer().getUserId())
                    .map(User::getFullName)
                    .orElse("Buyer");
        }

        String buyerBusinessName = o.getBuyer() != null && o.getBuyer().getBusinessName() != null
                ? o.getBuyer().getBusinessName()
                : buyerName + " Traders";

        String farmerName = "Farmer";
        if (o.getFarmer() != null && o.getFarmer().getUserId() != null) {
            farmerName = userRepository.findById(o.getFarmer().getUserId())
                    .map(User::getFullName)
                    .orElse("Farmer");
        }

        String quantityUnit = b != null && b.getQuantityUnit() != null ? b.getQuantityUnit() : "KG";

        return new TradeOrderResponse(
                o.getId(),
                o.getOrderNumber(),
                l != null ? l.getId() : 0L,
                l != null ? l.getListingCode() : "",
                o.getBuyer().getId(),
                buyerName,
                buyerBusinessName,
                o.getFarmer().getId(),
                farmerName,
                cropName,
                varietyName,
                o.getAgreedPricePerUnit(),
                o.getQuantity(),
                quantityUnit,
                o.getTotalAmount(),
                o.getStatus().name(),
                o.getCreatedAt() != null ? o.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "",
                o.getUpdatedAt() != null ? o.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : ""
        );
    }

    @Transactional(readOnly = true)
    public List<NearbyBuyerDto> getNearbyBuyersForFarmer(String farmerPublicId) {
        User farmerUser = userRepository.findByPublicId(farmerPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        FarmerProfile fp = farmerProfileRepository.findByUserId(farmerUser.getId()).orElse(null);
        String district = "";
        String taluk = "";
        if (fp != null) {
            if (fp.getFarmAddress() != null) {
                district = fp.getFarmAddress().getDistrict() != null ? fp.getFarmAddress().getDistrict() : "";
                taluk = fp.getFarmAddress().getTaluk() != null ? fp.getFarmAddress().getTaluk() : "";
            } else if (fp.getContactAddress() != null) {
                district = fp.getContactAddress().getDistrict() != null ? fp.getContactAddress().getDistrict() : "";
                taluk = fp.getContactAddress().getTaluk() != null ? fp.getContactAddress().getTaluk() : "";
            }
        }

        final String fDistrict = district;
        final String fTaluk = taluk;

        List<BuyerProfile> buyers = buyerProfileRepository.findAll();
        List<NearbyBuyerDto> results = new java.util.ArrayList<>();

        for (BuyerProfile bp : buyers) {
            if (bp.getBusinessAddress() == null) continue;

            String bDistrict = bp.getBusinessAddress().getDistrict() != null ? bp.getBusinessAddress().getDistrict() : "";
            String bTaluk = bp.getBusinessAddress().getTaluk() != null ? bp.getBusinessAddress().getTaluk() : "";
            String bTown = bp.getBusinessAddress().getVillageTownCity() != null ? bp.getBusinessAddress().getVillageTownCity() : "";

            double distance = 12.0;
            if (fDistrict.equalsIgnoreCase(bDistrict)) {
                distance = fTaluk.equalsIgnoreCase(bTaluk) ? 8.5 : 22.0;
            } else {
                distance = 65.0;
            }

            User bUser = userRepository.findById(bp.getUserId()).orElse(null);
            String publicId = bUser != null ? bUser.getPublicId() : UUID.randomUUID().toString();
            String name = bp.getBusinessName() != null ? bp.getBusinessName() : (bUser != null ? bUser.getFullName() : "Verified Buyer");

            results.add(new NearbyBuyerDto(
                bp.getId(),
                publicId,
                bp.getBusinessName(),
                name,
                true,
                bDistrict,
                bTaluk,
                bTown,
                distance,
                bp.getPurchaseCapacity() != null ? bp.getPurchaseCapacity() : "Commercial Wholesale",
                bp.getBuyerType() != null ? bp.getBuyerType() : "WHOLESALER",
                List.of("Banana", "Tomato", "Onion")
            ));
        }

        results.sort(java.util.Comparator.comparing(NearbyBuyerDto::distanceKm));
        return results;
    }
}
