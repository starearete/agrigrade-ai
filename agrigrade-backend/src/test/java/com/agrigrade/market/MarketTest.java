package com.agrigrade.market;

import com.agrigrade.market.dto.MarketRecommendationRequest;
import com.agrigrade.market.dto.MarketRecommendationResponse;
import com.agrigrade.market.dto.MarketResponse;
import com.agrigrade.market.service.MarketRecommendationService;
import com.agrigrade.market.service.MarketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class MarketTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MarketService marketService;

    @MockBean
    private MarketRecommendationService recommendationService;

    @Test
    @DisplayName("GET /api/v1/markets should return active regional markets")
    void shouldReturnMarkets() throws Exception {
        MarketResponse market = new MarketResponse(
                1L, "MKT-THENI", "Theni Farmers Wholesale Mandi", "MANDI", "Theni", "Tamil Nadu",
                BigDecimal.valueOf(10.0104), BigDecimal.valueOf(77.4768)
        );
        when(marketService.getAllMarkets()).thenReturn(List.of(market));

        mockMvc.perform(get("/api/v1/markets")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Theni Farmers Wholesale Mandi"));
    }

    @Test
    @DisplayName("POST /api/v1/markets/recommendations should return ranked recommendations")
    void shouldReturnRecommendations() throws Exception {
        MarketRecommendationRequest req = new MarketRecommendationRequest(
                "Banana", "G9 / Grand Naine", "GRADE_A", BigDecimal.valueOf(1000), "Theni", null, "BEST_NET_REALIZATION"
        );

        MarketRecommendationResponse rec = new MarketRecommendationResponse(
                1L, null, 1L, "Theni Farmers Wholesale Mandi", "Theni", "Banana", "G9 / Grand Naine", "GRADE_A",
                BigDecimal.valueOf(28.50), BigDecimal.valueOf(28.5), 42, BigDecimal.valueOf(628.25),
                BigDecimal.valueOf(28500), BigDecimal.valueOf(27871.75), BigDecimal.valueOf(98.5), 1,
                "2026-08-08", "2026-08-08", List.of()
        );

        when(recommendationService.generateRecommendations(any(MarketRecommendationRequest.class))).thenReturn(List.of(rec));

        mockMvc.perform(post("/api/v1/markets/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].marketName").value("Theni Farmers Wholesale Mandi"))
                .andExpect(jsonPath("$[0].rankOrder").value(1));
    }
}
