package com.agrigrade.trade.entity;

import com.agrigrade.auth.entity.User;
import com.agrigrade.listing.entity.MarketplaceListing;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_requests")
public class PurchaseRequest {

    public enum Status {
        PENDING,
        ACCEPTED,
        REJECTED,
        DECLINED,
        COUNTER_OFFER,
        CANCELLED,
        EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_public_id", nullable = false, unique = true, length = 50)
    private String requestPublicId;

    @Column(name = "client_request_id", length = 64)
    private String clientRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private com.agrigrade.chat.entity.Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private MarketplaceListing listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_user_id", nullable = false)
    private User buyerUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farmer_user_id", nullable = false)
    private User farmerUser;

    @Column(name = "requested_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal requestedQuantity;

    @Column(name = "offered_price_per_kg", precision = 12, scale = 2)
    private BigDecimal offeredPricePerKg;

    @Column(name = "requested_total_price", precision = 14, scale = 2)
    private BigDecimal requestedTotalPrice;

    @Column(name = "buyer_message", length = 2000)
    private String buyerMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private Status status = Status.PENDING;

    @Column(name = "counter_price_per_kg", precision = 12, scale = 2)
    private BigDecimal counterPricePerKg;

    @Column(name = "counter_quantity", precision = 12, scale = 2)
    private BigDecimal counterQuantity;

    @Column(name = "farmer_response_message", length = 2000)
    private String farmerResponseMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public PurchaseRequest() {}

    public PurchaseRequest(
            String requestPublicId,
            MarketplaceListing listing,
            User buyerUser,
            User farmerUser,
            BigDecimal requestedQuantity,
            BigDecimal offeredPricePerKg,
            BigDecimal requestedTotalPrice,
            String buyerMessage
    ) {
        this.requestPublicId = requestPublicId;
        this.listing = listing;
        this.buyerUser = buyerUser;
        this.farmerUser = farmerUser;
        this.requestedQuantity = requestedQuantity;
        this.offeredPricePerKg = offeredPricePerKg;
        this.requestedTotalPrice = requestedTotalPrice;
        this.buyerMessage = buyerMessage;
        this.status = Status.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public PurchaseRequest(
            String requestPublicId,
            String clientRequestId,
            MarketplaceListing listing,
            User buyerUser,
            User farmerUser,
            BigDecimal requestedQuantity,
            BigDecimal offeredPricePerKg,
            BigDecimal requestedTotalPrice,
            String buyerMessage
    ) {
        this(requestPublicId, listing, buyerUser, farmerUser, requestedQuantity, offeredPricePerKg, requestedTotalPrice, buyerMessage);
        this.clientRequestId = clientRequestId;
    }

    public Long getId() {
        return id;
    }

    public String getRequestPublicId() {
        return requestPublicId;
    }

    public void setRequestPublicId(String requestPublicId) {
        this.requestPublicId = requestPublicId;
    }

    public String getClientRequestId() {
        return clientRequestId;
    }

    public void setClientRequestId(String clientRequestId) {
        this.clientRequestId = clientRequestId;
    }

    public MarketplaceListing getListing() {
        return listing;
    }

    public void setListing(MarketplaceListing listing) {
        this.listing = listing;
    }

    public User getBuyerUser() {
        return buyerUser;
    }

    public void setBuyerUser(User buyerUser) {
        this.buyerUser = buyerUser;
    }

    public User getFarmerUser() {
        return farmerUser;
    }

    public void setFarmerUser(User farmerUser) {
        this.farmerUser = farmerUser;
    }

    public BigDecimal getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(BigDecimal requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public BigDecimal getOfferedPricePerKg() {
        return offeredPricePerKg;
    }

    public void setOfferedPricePerKg(BigDecimal offeredPricePerKg) {
        this.offeredPricePerKg = offeredPricePerKg;
    }

    public BigDecimal getRequestedTotalPrice() {
        return requestedTotalPrice;
    }

    public void setRequestedTotalPrice(BigDecimal requestedTotalPrice) {
        this.requestedTotalPrice = requestedTotalPrice;
    }

    public String getBuyerMessage() {
        return buyerMessage;
    }

    public void setBuyerMessage(String buyerMessage) {
        this.buyerMessage = buyerMessage;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public BigDecimal getCounterPricePerKg() {
        return counterPricePerKg;
    }

    public void setCounterPricePerKg(BigDecimal counterPricePerKg) {
        this.counterPricePerKg = counterPricePerKg;
    }

    public BigDecimal getCounterQuantity() {
        return counterQuantity;
    }

    public void setCounterQuantity(BigDecimal counterQuantity) {
        this.counterQuantity = counterQuantity;
    }

    public String getFarmerResponseMessage() {
        return farmerResponseMessage;
    }

    public void setFarmerResponseMessage(String farmerResponseMessage) {
        this.farmerResponseMessage = farmerResponseMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public com.agrigrade.chat.entity.Conversation getConversation() {
        return conversation;
    }

    public void setConversation(com.agrigrade.chat.entity.Conversation conversation) {
        this.conversation = conversation;
    }
}
