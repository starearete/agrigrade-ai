package com.agrigrade.listing;

import com.agrigrade.listing.dto.CreateListingRequest;
import com.agrigrade.listing.dto.CreateOrderRequest;
import com.agrigrade.listing.dto.MarketplaceListingResponse;
import com.agrigrade.listing.dto.OrderResponse;
import com.agrigrade.listing.service.MarketplaceListingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class MarketplaceListingTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MarketplaceListingService listingService;

    @Test
    @WithMockUser(username = "usr-farmer-001", roles = {"FARMER"})
    @DisplayName("POST /api/v1/batches/{batchId}/listing should create a listing")
    void shouldCreateListing() throws Exception {
        CreateListingRequest req = new CreateListingRequest(BigDecimal.valueOf(26.0), BigDecimal.valueOf(500));

        MarketplaceListingResponse resp = new MarketplaceListingResponse(
                1001L, 101L, "LIST-TOMATO-1001", 1L, "Ramasamy K.", "FARM-TN-8821", "Dindigul",
                true, "Tomato", "CO-3 (Hybrid Country)", BigDecimal.valueOf(26.0), BigDecimal.valueOf(500),
                BigDecimal.valueOf(2500), "KG", "GRADE_A_PREMIUM", 95.0, "2026-08-08", 2, "2026-08-08",
                6.5, 12.0, 6.5, "FRESH", "AGRI-CERT-2026-89001", "http://example.com/tomato.jpg", List.of(),
                "2026-08-08T10:00:00", "2026-08-15T10:00:00", "ACTIVE", 25.0
        );

        when(listingService.createListing(eq("usr-farmer-001"), eq(101L), any(CreateListingRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/v1/batches/101/listing")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.listingCode").value("LIST-TOMATO-1001"))
                .andExpect(jsonPath("$.cropName").value("Tomato"))
                .andExpect(jsonPath("$.askingPricePerUnit").value(26.0));
    }

    @Test
    @DisplayName("GET /api/v1/marketplace/listings should return active listings")
    void shouldReturnActiveListings() throws Exception {
        MarketplaceListingResponse resp = new MarketplaceListingResponse(
                1001L, 101L, "LIST-TOMATO-1001", 1L, "Ramasamy K.", "FARM-TN-8821", "Dindigul",
                true, "Tomato", "CO-3 (Hybrid Country)", BigDecimal.valueOf(26.0), BigDecimal.valueOf(500),
                BigDecimal.valueOf(2500), "KG", "GRADE_A_PREMIUM", 95.0, "2026-08-08", 2, "2026-08-08",
                6.5, 12.0, 6.5, "FRESH", "AGRI-CERT-2026-89001", "http://example.com/tomato.jpg", List.of(),
                "2026-08-08T10:00:00", "2026-08-15T10:00:00", "ACTIVE", 25.0
        );

        when(listingService.getMarketplaceListings(null, null, null, null)).thenReturn(List.of(resp));

        mockMvc.perform(get("/api/v1/marketplace/listings")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].cropName").value("Tomato"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    @WithMockUser(username = "usr-buyer-001", roles = {"BUYER"})
    @DisplayName("POST /api/v1/marketplace/listings/{id}/orders should create purchase order")
    void shouldCreateOrder() throws Exception {
        CreateOrderRequest req = new CreateOrderRequest(BigDecimal.valueOf(500), BigDecimal.valueOf(26.0), "BUYER_DELIVERY_NEEDED", "Quick delivery please");

        OrderResponse resp = new OrderResponse(
                801L, "ORD-TOMATO-801", 1001L, "LIST-TOMATO-1001", 501L, "Koyambedu Traders",
                1L, "Ramasamy K.", "Tomato", "CO-3 (Hybrid Country)", BigDecimal.valueOf(26.0),
                BigDecimal.valueOf(500), "KG", BigDecimal.valueOf(13000), "AGREED",
                BigDecimal.valueOf(2000), "ACTIVE", "2026-08-10T12:00:00"
        );

        when(listingService.createPurchaseOrder(eq("usr-buyer-001"), eq(1001L), any(CreateOrderRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/v1/marketplace/listings/1001/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber").value("ORD-TOMATO-801"))
                .andExpect(jsonPath("$.quantity").value(500))
                .andExpect(jsonPath("$.remainingQuantityOnListing").value(2000));
    }
}
