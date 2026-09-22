package com.agrigrade.profile;

import com.agrigrade.auth.dto.LoginResponse;
import com.agrigrade.auth.dto.RegisterRequest;
import com.agrigrade.auth.service.AuthService;
import com.agrigrade.profile.dto.AddressRequest;
import com.agrigrade.profile.dto.BuyerProfileUpdateRequest;
import com.agrigrade.profile.repository.BuyerProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class BuyerProfileTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private com.agrigrade.auth.repository.UserRepository userRepository;

    @Autowired
    private com.agrigrade.auth.repository.RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private BuyerProfileRepository buyerProfileRepository;

    private String farmerToken;
    private String buyerToken;

    @BeforeEach
    void setUp() {
        List.of("muthu@farmer.com", "anbu@buyer.com").forEach(email -> {
            userRepository.findByEmailIgnoreCase(email).ifPresent(u -> {
                buyerProfileRepository.findByUserId(u.getId()).ifPresent(buyerProfileRepository::delete);
                refreshTokenRepository.deleteByUserId(u.getId());
                userRepository.delete(u);
            });
        });

        LoginResponse farmerAuth = authService.register(new RegisterRequest(
            "Muthu Farmer", "muthu@farmer.com", "+919876500001", "Pass123!", "FARMER", "Muthu Farms", "Thanjavur"
        ));
        farmerToken = farmerAuth.token();

        LoginResponse buyerAuth = authService.register(new RegisterRequest(
            "Anbu Buyer", "anbu@buyer.com", "+919876500002", "Pass123!", "BUYER", "Anbu Traders", "Chennai"
        ));
        buyerToken = buyerAuth.token();
    }

    @Test
    @DisplayName("Buyer Profile - GET /api/v1/profiles/buyer (200 OK)")
    void testGetBuyerProfile() throws Exception {
        mockMvc.perform(get("/api/v1/profiles/buyer")
                .header("Authorization", "Bearer " + buyerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("Anbu Buyer"))
            .andExpect(jsonPath("$.email").value("anbu@buyer.com"))
            .andExpect(jsonPath("$.buyerCode").exists());
    }

    @Test
    @DisplayName("Buyer Profile - UPDATE /api/v1/profiles/buyer (200 OK)")
    void testUpdateBuyerProfile() throws Exception {
        AddressRequest addrReq = new AddressRequest(
            "45 Koyambedu Market Complex", "Block C", "Koyambedu", "Chennai", "Tamil Nadu", "600107",
            new BigDecimal("13.0700"), new BigDecimal("80.1900"), "BUSINESS", true
        );

        BuyerProfileUpdateRequest updateReq = new BuyerProfileUpdateRequest(
            "Anbarasan Buyer", "+919876500002", "Anbarasan Agri Exports", "33AAACA1234A1Z5", "EXPORTER", addrReq
        );

        mockMvc.perform(put("/api/v1/profiles/buyer")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("Anbarasan Buyer"))
            .andExpect(jsonPath("$.businessName").value("Anbarasan Agri Exports"))
            .andExpect(jsonPath("$.gstNumber").value("33AAACA1234A1Z5"))
            .andExpect(jsonPath("$.buyerType").value("EXPORTER"));
    }

    @Test
    @DisplayName("Buyer Profile - Farmer is FORBIDDEN from accessing Buyer Endpoint (403)")
    void testFarmerCannotAccessBuyerProfile() throws Exception {
        mockMvc.perform(get("/api/v1/profiles/buyer")
                .header("Authorization", "Bearer " + farmerToken))
            .andExpect(status().isForbidden());
    }
}
